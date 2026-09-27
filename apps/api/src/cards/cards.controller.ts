import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from './cards.service';

@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  getMyCards(@Request() req: { user: { userId: string } }) {
    return this.cardsService.findByUser(req.user.userId);
  }
}
