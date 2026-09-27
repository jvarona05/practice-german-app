import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: { autoPlayAudio: Boolean },
    default: { autoPlayAudio: true },
  })
  settings: { autoPlayAudio: boolean };

  @Prop({ default: 0 })
  practiceOffset: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
