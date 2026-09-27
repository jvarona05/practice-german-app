import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { CardsModule } from '../cards/cards.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CardsModule, UsersModule],
  controllers: [ReviewController],
})
export class ReviewModule {}
