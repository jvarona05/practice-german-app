import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson } from './lesson.schema';

@Injectable()
export class LessonsService {
  constructor(@InjectModel(Lesson.name) private lessonModel: Model<Lesson>) {}

  async create(userId: string, cardCount: number, title?: string): Promise<Lesson> {
    return this.lessonModel.create({
      userId: new Types.ObjectId(userId),
      cardCount,
      title,
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.lessonModel.countDocuments({ userId: new Types.ObjectId(userId) });
  }

  async findByUser(userId: string): Promise<Lesson[]> {
    return this.lessonModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }
}
