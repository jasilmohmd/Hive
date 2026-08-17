"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const stream_1 = require("stream");
const cloudinary_1 = require("cloudinary");
dotenv_1.default.config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary config is missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
}
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
});
class CloudinaryStorageService {
    uploadFile(fileBuffer_1, fileName_1, isPublic_1) {
        return __awaiter(this, arguments, void 0, function* (fileBuffer, fileName, isPublic, resourceType = 'image') {
            const baseName = fileName.replace(/\.[^/.]+$/, '');
            const publicId = `${(0, uuid_1.v4)()}-${baseName}`;
            const folder = isPublic ? 'public' : 'private';
            const type = isPublic ? 'upload' : 'authenticated';
            try {
                const uploadResult = yield new Promise((resolve, reject) => {
                    const timeoutMs = 90000;
                    const timer = setTimeout(() => {
                        reject(new Error(`Cloudinary upload timed out after ${timeoutMs}ms`));
                    }, timeoutMs);
                    const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                        folder,
                        public_id: publicId,
                        resource_type: resourceType,
                        type,
                    }, (error, result) => {
                        clearTimeout(timer);
                        if (error || !result) {
                            reject(error !== null && error !== void 0 ? error : new Error('Cloudinary upload failed.'));
                            return;
                        }
                        resolve(result);
                    });
                    stream_1.Readable.from(fileBuffer).pipe(uploadStream);
                });
                return isPublic ? uploadResult.secure_url : uploadResult.public_id;
            }
            catch (error) {
                const message = (error === null || error === void 0 ? void 0 : error.message) || 'Cloudinary upload failed unexpectedly';
                throw new Error(`Error uploading file: ${message}`);
            }
        });
    }
    getSignedUrl(fileKey_1) {
        return __awaiter(this, arguments, void 0, function* (fileKey, expiresIn = 600, resourceType = 'image') {
            try {
                const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
                return cloudinary_1.v2.url(fileKey, {
                    resource_type: resourceType,
                    type: 'authenticated',
                    sign_url: true,
                    secure: true,
                    expires_at: expiresAt,
                });
            }
            catch (error) {
                throw new Error(`Error generating signed URL: ${error}`);
            }
        });
    }
}
exports.default = new CloudinaryStorageService();
