"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const sharp = require("sharp");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
const env_config_1 = require("../../config/env.config");
let UploadsService = class UploadsService {
    constructor() {
        const config = (0, env_config_1.getEnvConfig)();
        this.bucketName = config.awsBucket || 'xpernex-storage';
        this.region = config.awsRegion || process.env.AWS_REGION || 'us-east-1';
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async getPresignedUploadUrl(originalName, mimeType, folder = 'products', tempUploadId, entityId) {
        const cleanFolder = folder.trim().replace(/\/+$/, '');
        const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
        const filename = `${(0, uuid_1.v4)()}.${ext}`;
        let key;
        if (tempUploadId) {
            key = `${cleanFolder}/temp/${tempUploadId}/${filename}`;
        }
        else if (entityId) {
            key = `${cleanFolder}/${entityId}/${filename}`;
        }
        else {
            key = `${cleanFolder}/${filename}`;
        }
        const useLocal = process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID;
        if (useLocal) {
            const uploadUrl = `http://localhost:5000/api/v1/upload/local-presigned?key=${key}`;
            const localKey = `http://localhost:5000/uploads/${key}`;
            return {
                uploadUrl,
                key: localKey,
                originalName,
                expiresIn: 900,
            };
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: mimeType,
        });
        const expiresIn = 900;
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        return {
            uploadUrl,
            key,
            originalName,
            expiresIn,
        };
    }
    async getMultiplePresignedUploadUrls(files, folder = 'products', tempUploadId, entityId) {
        const promises = files.map((file) => this.getPresignedUploadUrl(file.originalName, file.mimeType, folder, tempUploadId, entityId));
        return Promise.all(promises);
    }
    async finalizeTempImages(tempKeys, targetFolder, targetEntityId) {
        const finalizedKeys = [];
        for (const key of tempKeys) {
            if (key.startsWith('http://') || key.startsWith('https://')) {
                if (key.includes('/uploads/')) {
                    try {
                        const relativePath = key.split('/uploads/')[1];
                        if (relativePath.includes('/temp/')) {
                            const filename = relativePath.split('/').pop();
                            const newRelativePath = `${targetFolder.trim().replace(/\/+$/, '')}/${targetEntityId}/${filename}`;
                            const srcPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
                            const destPath = path.join(process.cwd(), 'public', 'uploads', newRelativePath);
                            const destDir = path.dirname(destPath);
                            if (!fs.existsSync(destDir)) {
                                fs.mkdirSync(destDir, { recursive: true });
                            }
                            fs.copyFileSync(srcPath, destPath);
                            fs.unlinkSync(srcPath);
                            const newUrl = key.split('/uploads/')[0] + '/uploads/' + newRelativePath;
                            finalizedKeys.push(newUrl);
                            continue;
                        }
                    }
                    catch (err) {
                        console.warn(`⚠️ Failed to finalize local temp image ${key}:`, err.message);
                    }
                }
                finalizedKeys.push(key);
                continue;
            }
            if (!key.includes('/temp/')) {
                finalizedKeys.push(key);
                continue;
            }
            const filename = key.split('/').pop();
            const newKey = `${targetFolder.trim().replace(/\/+$/, '')}/${targetEntityId}/${filename}`;
            try {
                await this.s3Client.send(new client_s3_1.CopyObjectCommand({
                    Bucket: this.bucketName,
                    CopySource: `${this.bucketName}/${key}`,
                    Key: newKey,
                }));
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }));
                finalizedKeys.push(newKey);
            }
            catch (err) {
                console.warn(`⚠️ Could not move temp image ${key} to ${newKey}:`, err.message);
                finalizedKeys.push(key);
            }
        }
        return finalizedKeys;
    }
    async uploadAndCompressImage(buffer, originalName, mimeType, folder = 'products') {
        let finalBuffer = buffer;
        let finalMimeType = mimeType;
        let fileExtension = 'webp';
        if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
            finalBuffer = await sharp(buffer)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();
            finalMimeType = 'image/webp';
        }
        else if (mimeType.includes('gif')) {
            fileExtension = 'gif';
        }
        else {
            const ext = originalName.split('.').pop();
            if (ext)
                fileExtension = ext;
        }
        const cleanFolderName = folder.trim().replace(/\/+$/, '');
        const filename = `${(0, uuid_1.v4)()}_${originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
        const key = `${cleanFolderName}/${filename}`;
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: finalBuffer,
                ContentType: finalMimeType,
            }));
            const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            return { url, key };
        }
        catch (error) {
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
    async deleteImage(key) {
        if (!key)
            return;
        if (key.startsWith('http://') || key.startsWith('https://')) {
            if (key.includes('/uploads/')) {
                try {
                    const relativePath = key.split('/uploads/')[1];
                    const filePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                catch (err) {
                    console.warn('⚠️ Failed to delete local file:', err.message);
                }
            }
            return;
        }
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
        }
        catch (err) {
            console.warn(`⚠️ S3 Delete error for key ${key}:`, err.message);
        }
    }
    async saveLocalFile(key, req) {
        const cleanKey = key.replace(/^\/+/, '');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(cleanKey));
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
        const writer = fs.createWriteStream(filePath);
        return new Promise((resolve, reject) => {
            req.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
            req.on('error', reject);
        });
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map