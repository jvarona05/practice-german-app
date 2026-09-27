import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lesson, LessonSchema } from './lesson.schema';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { CardsModule } from '../cards/cards.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
    CardsModule,
    AiModule,
  ],
  providers: [LessonsService],
  controllers: [LessonsController],
  exports: [LessonsService],
})
export class LessonsModule {}
