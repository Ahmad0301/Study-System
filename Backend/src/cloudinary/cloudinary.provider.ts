import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: 'hbjbbbwt',
      api_key: '317469574486331',
      api_secret: '4Y7CeGg6P_fbNXHSXFgAZ2DN6I4',
    });
  },
  inject: [ConfigService],
};
