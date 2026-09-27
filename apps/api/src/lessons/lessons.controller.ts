import { Controller, Post, Get, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { TranslationLang, CardType } from '@german-app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LessonsService } from './lessons.service';
import { CardsService } from '../cards/cards.service';
import { AiProvider } from '../ai/ai.provider';

class AnalyzeDto {
  @IsString()
  text: string;
}

class SuggestedCardDto {
  @IsString()
  german: string;

  @IsString()
  translation: string;

  @IsIn(['es', 'en'])
  translationLang: TranslationLang;

  @IsString()
  @IsOptional()
  type?: CardType;
}

class SaveCardsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestedCardDto)
  cards: SuggestedCardDto[];

  @IsString()
  @IsOptional()
  lessonTitle?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(
    private lessonsService: LessonsService,
    private cardsService: CardsService,
    private aiProvider: AiProvider,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto) {
    if (!dto.text?.trim()) throw new BadRequestException('Text is required');
    const suggestions = await this.aiProvider.extractCards(dto.text.trim());
    return { suggestions };
  }

  @Post('save')
  async save(@Body() dto: SaveCardsDto, @Request() req: { user: { userId: string } }) {
    if (!dto.cards?.length) throw new BadRequestException('No cards to save');
    const savedCards = await this.cardsService.createMany(req.user.userId, dto.cards);
    await this.lessonsService.create(req.user.userId, savedCards.length, dto.lessonTitle);
    return { savedCount: savedCards.length };
  }

  @Get()
  getMyLessons(@Request() req: { user: { userId: string } }) {
    return this.lessonsService.findByUser(req.user.userId);
  }
}
