import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card } from './card.schema';
import { SuggestedCard } from '@german-app/shared';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<Card>) {}

  async createMany(userId: string, cards: SuggestedCard[]): Promise<Card[]> {
    const now = new Date();
    const docs = cards.map((c) => ({
      userId: new Types.ObjectId(userId),
      german: c.german,
      translation: c.translation,
      translationLang: c.translationLang,
      type: c.type,
      strength: 0,
      dueDate: now,
      reviewCount: 0,
    }));
    return this.cardModel.insertMany(docs);
  }

  async findByUser(userId: string): Promise<Card[]> {
    return this.cardModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async findDueCards(userId: string, limit = 20): Promise<Card[]> {
    const now = new Date();
    return this.cardModel
      .find({
        userId: new Types.ObjectId(userId),
        dueDate: { $lte: now },
      })
      .sort({ strength: 1, dueDate: 1 })
      .limit(limit);
  }

  async applyRating(cardId: string, action: 'again' | 'good' | 'easy'): Promise<Card | null> {
    const card = await this.cardModel.findById(cardId);
    if (!card) return null;

    const { newStrength, nextDueDate } = computeNextState(card.strength, action);

    card.strength = newStrength;
    card.dueDate = nextDueDate;
    card.lastReviewedAt = new Date();
    card.reviewCount += 1;

    return card.save();
  }

  async getStats(userId: string) {
    const uid = new Types.ObjectId(userId);
    const now = new Date();

    const [total, dueToday, newCards, learned, reinforcement, totalLessons] = await Promise.all([
      this.cardModel.countDocuments({ userId: uid }),
      this.cardModel.countDocuments({ userId: uid, dueDate: { $lte: now } }),
      this.cardModel.countDocuments({ userId: uid, strength: 0 }),
      this.cardModel.countDocuments({ userId: uid, strength: 5 }),
      this.cardModel.countDocuments({ userId: uid, strength: { $in: [0, 1] } }),
      // lesson count handled in LessonsService — return 0 here, merged in StatsController
      Promise.resolve(0),
    ]);

    return { totalCards: total, dueToday, newCards, learnedCards: learned, needsReinforcement: reinforcement };
  }
}

// Pure function: takes current strength + action, returns new strength + next due date.
// Isolated here so it's trivial to test and tune without touching the DB layer.
function computeNextState(
  currentStrength: number,
  action: 'again' | 'good' | 'easy',
): { newStrength: number; nextDueDate: Date } {
  const INTERVALS_DAYS: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

  let newStrength: number;
  switch (action) {
    case 'again':
      newStrength = 0;
      break;
    case 'good':
      newStrength = Math.min(5, currentStrength + 1);
      break;
    case 'easy':
      newStrength = Math.min(5, currentStrength + 2);
      break;
  }

  const daysUntilNext = INTERVALS_DAYS[newStrength] ?? 0;
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + daysUntilNext);

  return { newStrength, nextDueDate };
}
