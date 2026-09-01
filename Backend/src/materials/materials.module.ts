import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { Material, MaterialSchema } from './schemas/material.schema';
import { Subject, SubjectSchema } from '../subjects/schemas/subject.schema';
import { ActivitiesModule } from '../activities/activities.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    JwtModule.register({}),
    ActivitiesModule,
    CloudinaryModule,
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
