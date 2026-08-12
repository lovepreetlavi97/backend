import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { getEnvConfig } from '../../config/env.config';

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  originalName: string;
  expiresIn: number;
}

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    const config = getEnvConfig();
    this.bucketName = config.awsBucket || 'xpernex-storage';
    this.region = config.awsRegion || process.env.AWS_REGION || 'us-east-1';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Generates a single S3 presigned upload URL for direct-to-bucket uploading.
   */
  async getPresignedUploadUrl(
    originalName: string,
    mimeType: string,
    folder: string = 'products',
    tempUploadId?: string,
    entityId?: string,
  ): Promise<PresignedUrlResult> {
    const cleanFolder = folder.trim().replace(/\/+$/, '');
    const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
    const filename = `${uuidv4()}.${ext}`;

    let key: string;
    if (tempUploadId) {
      key = `${cleanFolder}/temp/${tempUploadId}/${filename}`;
    } else if (entityId) {
      key = `${cleanFolder}/${entityId}/${filename}`;
    } else {
      key = `${cleanFolder}/${filename}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    // Signed URL valid for 15 minutes (900 seconds)
    const expiresIn = 900;
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      originalName,
      expiresIn,
    };
  }

  /**
   * Generates multiple S3 presigned upload URLs in batch.
   */
  async getMultiplePresignedUploadUrls(
    files: Array<{ originalName: string; mimeType: string }>,
    folder: string = 'products',
    tempUploadId?: string,
    entityId?: string,
  ): Promise<PresignedUrlResult[]> {
    const promises = files.map((file) =>
      this.getPresignedUploadUrl(
        file.originalName,
        file.mimeType,
        folder,
        tempUploadId,
        entityId,
      ),
    );
    return Promise.all(promises);
  }

  /**
   * Copies temporary upload objects to final entity folder after creation.
   */
  async finalizeTempImages(
    tempKeys: string[],
    targetFolder: string,
    targetEntityId: string,
  ): Promise<string[]> {
    const finalizedKeys: string[] = [];

    for (const key of tempKeys) {
      if (!key.includes('/temp/')) {
        finalizedKeys.push(key);
        continue;
      }

      const filename = key.split('/').pop();
      const newKey = `${targetFolder.trim().replace(/\/+$/, '')}/${targetEntityId}/${filename}`;

      try {
        // Copy object to new location
        await this.s3Client.send(
          new CopyObjectCommand({
            Bucket: this.bucketName,
            CopySource: `${this.bucketName}/${key}`,
            Key: newKey,
          }),
        );

        // Delete original temp object
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );

        finalizedKeys.push(newKey);
      } catch (err) {
        console.warn(`⚠️ Could not move temp image ${key} to ${newKey}:`, err.message);
        finalizedKeys.push(key); // Fallback to original key if move fails
      }
    }

    return finalizedKeys;
  }

  /**
   * Legacy method for server-side upload & compression.
   */
  async uploadAndCompressImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'products',
  ): Promise<{ url: string; key: string }> {
    let finalBuffer = buffer;
    let finalMimeType = mimeType;
    let fileExtension = 'webp';

    if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      finalMimeType = 'image/webp';
    } else if (mimeType.includes('gif')) {
      fileExtension = 'gif';
    } else {
      const ext = originalName.split('.').pop();
      if (ext) fileExtension = ext;
    }

    const cleanFolderName = folder.trim().replace(/\/+$/, '');
    const filename = `${uuidv4()}_${originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    const key = `${cleanFolderName}/${filename}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: finalBuffer,
          ContentType: finalMimeType,
        }),
      );

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      console.warn('⚠️ S3 Upload failed, falling back to local storage:', error.message);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanFolderName);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      const localUrl = `http://localhost:5000/uploads/${cleanFolderName}/${filename}`;
      return { url: localUrl, key: localUrl };
    }
  }

  /**
   * Deletes single image from S3 or local fallback.
   */
  async deleteImage(key: string): Promise<void> {
    if (!key) return;

    if (key.startsWith('http://') || key.startsWith('https://')) {
      if (key.includes('/uploads/')) {
        try {
          const relativePath = key.split('/uploads/')[1];
          const filePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.warn('⚠️ Failed to delete local file:', err.message);
        }
      }
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (err) {
      console.warn(`⚠️ S3 Delete error for key ${key}:`, err.message);
    }
  }
}
