import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: { email: string; passwordHash: string; name: string }): Promise<User> {
    return this.userModel.create(data);
  }

  async updateSettings(userId: string, settings: { autoPlayAudio?: boolean }): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { settings } },
      { new: true },
    );
  }

  async updatePracticeOffset(userId: string, offset: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { practiceOffset: offset } });
  }
}
