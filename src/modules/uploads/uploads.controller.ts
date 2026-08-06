import { Controller, Post, Delete, UseInterceptors, UploadedFile, UploadedFiles, Body, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Uploads')
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload and compress a single image to S3' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const targetFolder = folder || 'products';
    const result = await this.uploadsService.uploadAndCompressImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      targetFolder,
    );
    return result;
  }

  @Post('images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Upload and compress multiple images to S3' })
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
    const deletePromises = keysArray.filter(Boolean).map((key) => this.uploadsService.deleteImage(key));
    await Promise.all(deletePromises);
    return { status: 'success', message: 'Images deleted successfully' };
  }
}
