import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from '../cards/cards.service';
import { LessonsService } from '../lessons/lessons.service';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(
    private cardsService: CardsService,
    private lessonsService: LessonsService,
  ) {}

  @Get()
  async getDashboard(@Request() req: { user: { userId: string } }) {
    const [cardStats, totalLessons] = await Promise.all([
      this.cardsService.getStats(req.user.userId),
      this.lessonsService.countByUser(req.user.userId),
    ]);
    return { ...cardStats, totalLessons };
  }
}
