import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary config is missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

class CloudinaryStorageService {
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    isPublic: boolean,
    resourceType: CloudinaryResourceType = 'image'
  ): Promise<string> {
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const publicId = `${uuidv4()}-${baseName}`;
    const folder = isPublic ? 'public' : 'private';
    const type = isPublic ? 'upload' : 'authenticated';

    try {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const timeoutMs = 90000;
        const timer = setTimeout(() => {
          reject(new Error(`Cloudinary upload timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: resourceType,
            type,
          },
          (error, result) => {
            clearTimeout(timer);
            if (error || !result) {
              reject(error ?? new Error('Cloudinary upload failed.'));
              return;
            }
            resolve(result as { secure_url: string; public_id: string });
          }
        );

        Readable.from(fileBuffer).pipe(uploadStream);
      });

      return isPublic ? uploadResult.secure_url : uploadResult.public_id;
    } catch (error: any) {
      const message =
        error?.message || 'Cloudinary upload failed unexpectedly';
      throw new Error(`Error uploading file: ${message}`);
    }
  }

  async getSignedUrl(
    fileKey: string,
    expiresIn = 600,
    resourceType: CloudinaryResourceType = 'image'
  ): Promise<string> {
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
      return cloudinary.url(fileKey, {
        resource_type: resourceType,
        type: 'authenticated',
        sign_url: true,
        secure: true,
        expires_at: expiresAt,
      });
    } catch (error) {
      throw new Error(`Error generating signed URL: ${error}`);
    }
  }
}

export default new CloudinaryStorageService();
