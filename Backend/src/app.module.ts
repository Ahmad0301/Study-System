import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

    // Connects to MongoDB using the URI you provide in .env (MONGODB_URI)
    MongooseModule.forRoot(process.env.MONGODB_URI as string),

    AuthModule,
    SubjectsModule,
    MaterialsModule,
    ActivitiesModule,
    AiModule,
  ],
})
export class AppModule { }
