import { Controller, Get, Post, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from '../cards/cards.service';

class RateDto {
  action: 'again' | 'good' | 'easy';
}

@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private cardsService: CardsService) {}

  // GET /api/review/session — returns up to 20 cards due for this user
  @Get('session')
  getSession(@Request() req: { user: { userId: string } }) {
    return this.cardsService.findDueCards(req.user.userId, 20);
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
    const card = await this.cardsService.applyRating(cardId, dto.action);
    return card;
  }
}
