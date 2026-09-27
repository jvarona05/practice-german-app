import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Card extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  german: string;

  @Prop({ required: true })
  translation: string;

  @Prop({ required: true, enum: ['es', 'en'], default: 'es' })
  translationLang: 'es' | 'en';

  @Prop({
    enum: ['reflexive-verb', 'separable-verb', 'expression', 'connector',
      'preposition', 'vocabulary', 'conversation-pattern', 'other'],
  })
  type?: string;

  @Prop({ required: true, min: 0, max: 5, default: 0 })
  strength: number;

  @Prop({ required: true, index: true })
  dueDate: Date;

  @Prop()
  lastReviewedAt?: Date;

  @Prop({ required: true, default: 0 })
  reviewCount: number;
}

export const CardSchema = SchemaFactory.createForClass(Card);

// Compound index for the hot review query: cards due for a given user
CardSchema.index({ userId: 1, dueDate: 1 });
