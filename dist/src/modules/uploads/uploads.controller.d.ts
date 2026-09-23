import { Request } from 'express';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    getPresignedUrl(originalName: string, mimeType: string, folder?: string, tempUploadId?: string, entityId?: string): Promise<import("./uploads.service").PresignedUrlResult>;
    getMultiplePresignedUrls(files: Array<{
        originalName: string;
        mimeType: string;
    }>, folder?: string, tempUploadId?: string, entityId?: string): Promise<import("./uploads.service").PresignedUrlResult[]>;
    uploadSingle(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        key: string;
    }>;
    uploadMultiple(files: Express.Multer.File[], folder?: string): Promise<{
        urls: string[];
        keys: string[];
    }>;
    deleteSingle(key: string): Promise<{
        status: string;
        message: string;
    }>;
    deleteMultiple(keys: string | string[]): Promise<{
        status: string;
        message: string;
    }>;
    uploadLocalPresigned(key: string, req: Request): Promise<{
        status: string;
        message: string;
    }>;
}
