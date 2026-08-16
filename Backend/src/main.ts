import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const getCleanFrontendUrl = () => {
    const envUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return envUrl.trim().replace(/\/+$/, '');
  };

  // Serve uploaded files statically inline
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, filePath) => {
      // Allow frontend origin to fetch files cross-origin (needed for mammoth DOCX parsing)
      res.setHeader('Access-Control-Allow-Origin', getCleanFrontendUrl());
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      const lower = filePath.toLowerCase();
      if (lower.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      } else if (lower.endsWith('.docx')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'inline');
      } else if (lower.endsWith('.doc')) {
        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', 'inline');
      }
    },
  });

  // Global validation pipe -> auto validates DTOs using class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that are not in the DTO
      forbidNonWhitelisted: true, // throws error if extra properties are sent
      transform: true, // auto-transforms payloads to DTO instances
    }),
  );

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    getCleanFrontendUrl(),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Auth backend running on port ${port}`);
}
bootstrap();
