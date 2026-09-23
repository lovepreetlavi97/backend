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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const uploads_service_1 = require("./uploads.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let UploadsController = class UploadsController {
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    async getPresignedUrl(originalName, mimeType, folder, tempUploadId, entityId) {
        return this.uploadsService.getPresignedUploadUrl(originalName, mimeType, folder || 'products', tempUploadId, entityId);
    }
    async getMultiplePresignedUrls(files, folder, tempUploadId, entityId) {
        return this.uploadsService.getMultiplePresignedUploadUrls(files || [], folder || 'products', tempUploadId, entityId);
    }
    async uploadSingle(file, folder) {
        const targetFolder = folder || 'products';
        return this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, targetFolder);
    }
    async uploadMultiple(files, folder) {
        const targetFolder = folder || 'products';
        const uploadPromises = files.map((file) => this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, targetFolder));
        const results = await Promise.all(uploadPromises);
        return {
            urls: results.map((r) => r.url),
            keys: results.map((r) => r.key),
        };
    }
    async deleteSingle(key) {
        if (key) {
            await this.uploadsService.deleteImage(key);
        }
        return { status: 'success', message: 'Image deleted successfully' };
    }
    async deleteMultiple(keys) {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        const deletePromises = keysArray.filter(Boolean).map((key) => this.uploadsService.deleteImage(key));
        await Promise.all(deletePromises);
        return { status: 'success', message: 'Images deleted successfully' };
    }
    async uploadLocalPresigned(key, req) {
        await this.uploadsService.saveLocalFile(key, req);
        return { status: 'success', message: 'File uploaded locally successfully' };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('presigned-url'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a single S3 presigned URL for direct client upload' }),
    (0, swagger_1.ApiBody)({
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
    }),
    __param(0, (0, common_1.Body)('originalName')),
    __param(1, (0, common_1.Body)('mimeType')),
    __param(2, (0, common_1.Body)('folder')),
    __param(3, (0, common_1.Body)('tempUploadId')),
    __param(4, (0, common_1.Body)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getPresignedUrl", null);
__decorate([
    (0, common_1.Post)('presigned-urls'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate multiple S3 presigned URLs for batch direct uploads' }),
    (0, swagger_1.ApiBody)({
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
    }),
    __param(0, (0, common_1.Body)('files')),
    __param(1, (0, common_1.Body)('folder')),
    __param(2, (0, common_1.Body)('tempUploadId')),
    __param(3, (0, common_1.Body)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getMultiplePresignedUrls", null);
__decorate([
    (0, common_1.Post)('image'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload and compress a single image to S3 (Server proxy)' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadSingle", null);
__decorate([
    (0, common_1.Post)('images'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload and compress multiple images to S3 (Server proxy)' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadMultiple", null);
__decorate([
    (0, common_1.Delete)('deleteImage'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an image from S3' }),
    __param(0, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteSingle", null);
__decorate([
    (0, common_1.Delete)('deleteImages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete multiple images from S3' }),
    __param(0, (0, common_1.Query)('keys')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteMultiple", null);
__decorate([
    (0, common_1.Put)('local-presigned'),
    (0, swagger_1.ApiOperation)({ summary: 'Local Storage Fallback: Upload a file directly to local disk' }),
    __param(0, (0, common_1.Query)('key')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadLocalPresigned", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map