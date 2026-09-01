import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {}

  private configure() {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: any,
    folder = 'study-assistant/avatars',
  ): Promise<UploadApiResponse> {
    this.configure();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              new InternalServerErrorException(`Cloudinary upload failed: ${error.message}`),
            );
          }
          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary upload returned empty result'));
          }
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder = 'study-assistant/documents',
  ): Promise<UploadApiResponse> {
    this.configure();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',   // required for PDF / DOCX
          use_filename: true,
          unique_filename: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              new InternalServerErrorException(`Cloudinary document upload failed: ${error.message}`),
            );
          }
          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary upload returned empty result'));
          }
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    if (!publicId) return;
    this.configure();
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      console.error(`Failed to delete Cloudinary image (${publicId}):`, err);
    }
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'raw'): Promise<any> {
    if (!publicId) return;
    this.configure();
    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err: any) {
      console.error(`Failed to delete Cloudinary file (${publicId}):`, err);
    }
  }
}
