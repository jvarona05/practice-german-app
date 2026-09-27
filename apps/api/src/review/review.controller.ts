import { Controller, Get, Post, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from '../cards/cards.service';
import { UsersService } from '../users/users.service';

class RateDto {
  @IsIn(['again', 'good', 'easy'])
  action: 'again' | 'good' | 'easy';
}

const PRACTICE_BATCH_SIZE = 15;

@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(
    private cardsService: CardsService,
    private usersService: UsersService,
  ) {}

  // GET /api/review/start — decides whether to return due cards or next practice batch
  // Due cards always have priority and do NOT advance the practice rotation offset.
  @Get('start')
  async startSession(@Request() req: { user: { userId: string } }) {
    const userId = req.user.userId;

    // Priority 1: due cards
    const dueCards = await this.cardsService.findDueCards(userId, 20);
    if (dueCards.length > 0) {
      return { type: 'due' as const, cards: dueCards };
    }

    // Priority 2: normal practice rotation
    const user = await this.usersService.findById(userId);
    const currentOffset = user?.practiceOffset ?? 0;

    const { cards, total } = await this.cardsService.findPracticeCards(userId, PRACTICE_BATCH_SIZE, currentOffset);

    // Advance offset for the next practice session (wraps around)
    const nextOffset = total > 0 ? (currentOffset + PRACTICE_BATCH_SIZE) % total : 0;
    await this.usersService.updatePracticeOffset(userId, nextOffset);

    return { type: 'practice' as const, cards, total, currentOffset };
  }

  // POST /api/review/:cardId/rate — submit rating, update strength + dueDate
  @Post(':cardId/rate')
  async rateCard(
    @Param('cardId') cardId: string,
    @Body() dto: RateDto,
    @Request() req: { user: { userId: string } },
  ) {
    if (!['again', 'good', 'easy'].includes(dto.action)) {
      throw new BadRequestException('Invalid action');
    }
    return this.cardsService.applyRating(cardId, dto.action);
  }
}
