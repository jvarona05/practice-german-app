import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [CardsModule],
  controllers: [ReviewController],
})
export class ReviewModule {}
