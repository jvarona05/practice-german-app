import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { CardsModule } from '../cards/cards.module';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [CardsModule, LessonsModule],
  controllers: [StatsController],
})
export class StatsModule {}
