import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card } from './card.schema';
import { SuggestedCard } from '@german-app/shared';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<Card>) {}

  private toCardDTO(doc: Card) {
    return {
      id: (doc._id || doc.id).toString(),
      userId: (doc.userId instanceof Types.ObjectId ? doc.userId.toString() : doc.userId),
      german: doc.german,
      translation: doc.translation,
      translationLang: doc.translationLang,
      type: doc.type,
      strength: doc.strength,
      dueDate: doc.dueDate.toISOString(),
      lastReviewedAt: doc.lastReviewedAt?.toISOString(),
      reviewCount: doc.reviewCount,
      createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async createMany(userId: string, cards: SuggestedCard[]) {
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
    const created = await this.cardModel.insertMany(docs);
    return created.map((doc) => this.toCardDTO(doc));
  }

  async findByUser(userId: string) {
    const cards = await this.cardModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
    return cards.map((doc) => this.toCardDTO(doc));
  }

  async findDueCards(userId: string, limit = 20) {
    const now = new Date();
    const cards = await this.cardModel
      .find({
        userId: new Types.ObjectId(userId),
        dueDate: { $lte: now },
      })
      .sort({ strength: 1, dueDate: 1 })
      .limit(limit);
    return cards.map((doc) => this.toCardDTO(doc));
  }

  async findPracticeCards(userId: string, limit = 30) {
    const cards = await this.cardModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ strength: 1, dueDate: 1 })
      .limit(limit);
    return cards.map((doc) => this.toCardDTO(doc));
  }

  async applyRating(cardId: string, action: 'again' | 'good' | 'easy') {
    const card = await this.cardModel.findById(cardId);
    if (!card) return null;

    const { newStrength, nextDueDate } = computeNextState(card.strength, action);

    card.strength = newStrength;
    card.dueDate = nextDueDate;
    card.lastReviewedAt = new Date();
    card.reviewCount += 1;

    const saved = await card.save();
    return this.toCardDTO(saved);
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
