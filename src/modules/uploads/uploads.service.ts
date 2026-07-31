import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
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
    });
  }

  async uploadAndCompressImage(buffer: Buffer, originalName: string, mimeType: string, folder: string = 'products'): Promise<string> {
    let finalBuffer = buffer;
    let finalMimeType = mimeType;
    let fileExtension = 'webp';

    if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      finalMimeType = 'image/webp';
    }

    const key = `${folder}/${uuidv4()}_${originalName.replace(/\.[^/.]+$/, '')}.${fileExtension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: finalBuffer,
        ContentType: finalMimeType,
      })
    );

    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
