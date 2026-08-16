import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { SubjectsModule } from './subjects/subjects.module';
import { MaterialsModule } from './materials/materials.module';
import { ActivitiesModule } from './activities/activities.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Loads .env file and makes ConfigService available app-wide
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Connects to MongoDB using ConfigService from .env (MONGODB_URI)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          process.env.MONGODB_URI ||
          'mongodb://127.0.0.1:27017/study-assistant',
      }),
    }),

    AuthModule,
    SubjectsModule,
    MaterialsModule,
    ActivitiesModule,
    AiModule,
  ],
})
export class AppModule { }
