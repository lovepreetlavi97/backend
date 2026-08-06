import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { getEnvConfig } from '../../config/env.config';

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const config = getEnvConfig();
    this.bucketName = config.awsBucket;
    this.s3Client = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadAndCompressImage(buffer: Buffer, originalName: string, mimeType: string, folder: string = 'products'): Promise<{ url: string; key: string }> {
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
        })
      );

      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      console.warn('⚠️ S3 Upload failed, falling back to local storage:', error.message);

      // Local storage fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanFolderName);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      // Return a local URL as both the URL and Key to prevent frontend from prefixing S3 URL
      const localUrl = `http://localhost:5000/uploads/${cleanFolderName}/${filename}`;
      return { url: localUrl, key: localUrl };
    }
  }

  async deleteImage(key: string): Promise<void> {
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

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  }
}
