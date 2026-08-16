import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { QuizAttempt, QuizAttemptSchema } from '../ai/schemas/quiz-attempt.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
    ]),
    JwtModule.register({}),
    ActivitiesModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
