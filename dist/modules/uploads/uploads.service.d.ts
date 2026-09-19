export interface PresignedUrlResult {
    uploadUrl: string;
    key: string;
    originalName: string;
    expiresIn: number;
}
export declare class UploadsService {
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    constructor();
    getPresignedUploadUrl(originalName: string, mimeType: string, folder?: string, tempUploadId?: string, entityId?: string): Promise<PresignedUrlResult>;
    getMultiplePresignedUploadUrls(files: Array<{
        originalName: string;
        mimeType: string;
    }>, folder?: string, tempUploadId?: string, entityId?: string): Promise<PresignedUrlResult[]>;
    finalizeTempImages(tempKeys: string[], targetFolder: string, targetEntityId: string): Promise<string[]>;
    uploadAndCompressImage(buffer: Buffer, originalName: string, mimeType: string, folder?: string): Promise<{
        url: string;
        key: string;
    }>;
    deleteImage(key: string): Promise<void>;
    saveLocalFile(key: string, req: any): Promise<void>;
}
