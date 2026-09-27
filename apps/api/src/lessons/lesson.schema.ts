import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Lesson extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop()
  title?: string;

  @Prop({ required: true, default: 0 })
  cardCount: number;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
