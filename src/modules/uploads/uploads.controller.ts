import {
  Controller,
  Post,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Uploads')
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Generate a single S3 presigned URL for direct client upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        originalName: { type: 'string', example: 'ring.jpg' },
        mimeType: { type: 'string', example: 'image/jpeg' },
        folder: { type: 'string', example: 'products' },
        tempUploadId: { type: 'string', example: 'temp-12345' },
        entityId: { type: 'string', example: 'prod-999' },
      },
      required: ['originalName', 'mimeType'],
    },
  })
  async getPresignedUrl(
    @Body('originalName') originalName: string,
    @Body('mimeType') mimeType: string,
    @Body('folder') folder?: string,
    @Body('tempUploadId') tempUploadId?: string,
    @Body('entityId') entityId?: string,
  ) {
    return this.uploadsService.getPresignedUploadUrl(
      originalName,
      mimeType,
      folder || 'products',
      tempUploadId,
      entityId,
    );
  }

  @Post('presigned-urls')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Generate multiple S3 presigned URLs for batch direct uploads' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalName: { type: 'string' },
              mimeType: { type: 'string' },
            },
          },
        },
        folder: { type: 'string', example: 'products' },
        tempUploadId: { type: 'string', example: 'temp-12345' },
        entityId: { type: 'string', example: 'prod-999' },
      },
      required: ['files'],
    },
  })
  async getMultiplePresignedUrls(
    @Body('files') files: Array<{ originalName: string; mimeType: string }>,
    @Body('folder') folder?: string,
    @Body('tempUploadId') tempUploadId?: string,
    @Body('entityId') entityId?: string,
  ) {
    return this.uploadsService.getMultiplePresignedUploadUrls(
      files || [],
      folder || 'products',
      tempUploadId,
      entityId,
    );
  }

  // Legacy single file proxy upload (retained for backward compatibility)
  @Post('image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload and compress a single image to S3 (Server proxy)' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const targetFolder = folder || 'products';
    return this.uploadsService.uploadAndCompressImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      targetFolder,
    );
  }

  // Legacy multiple file proxy upload (retained for backward compatibility)
  @Post('images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Upload and compress multiple images to S3 (Server proxy)' })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    const targetFolder = folder || 'products';
    const uploadPromises = files.map((file) =>
      this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        targetFolder,
      ),
    );
    const results = await Promise.all(uploadPromises);

    return {
      urls: results.map((r) => r.url),
      keys: results.map((r) => r.key),
    };
  }

  @Delete('deleteImage')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Delete an image from S3' })
  async deleteSingle(@Query('key') key: string) {
    if (key) {
      await this.uploadsService.deleteImage(key);
    }
    return { status: 'success', message: 'Image deleted successfully' };
  }

  @Delete('deleteImages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Delete multiple images from S3' })
  async deleteMultiple(@Query('keys') keys: string | string[]) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const deletePromises = keysArray.filter(Boolean).map((key) =>
      this.uploadsService.deleteImage(key),
    );
    await Promise.all(deletePromises);
    return { status: 'success', message: 'Images deleted successfully' };
  }

  @Put('local-presigned')
  @ApiOperation({ summary: 'Local Storage Fallback: Upload a file directly to local disk' })
  async uploadLocalPresigned(
    @Query('key') key: string,
    @Req() req: Request,
  ) {
    await this.uploadsService.saveLocalFile(key, req);
    return { status: 'success', message: 'File uploaded locally successfully' };
  }
}
