import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private configService;
    constructor(configService: ConfigService);
    private configure;
    uploadImage(file: any, folder?: string): Promise<UploadApiResponse>;
    deleteImage(publicId: string): Promise<any>;
}
