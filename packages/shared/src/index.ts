// Core domain types shared between frontend and backend

export type TranslationLang = 'es' | 'en';

export type CardType =
  | 'reflexive-verb'
  | 'separable-verb'
  | 'expression'
  | 'connector'
  | 'preposition'
  | 'vocabulary'
  | 'conversation-pattern'
  | 'other';

export type RatingAction = 'again' | 'good' | 'easy';

// 0 = new/struggling → 5 = fully learned
export type CardStrength = 0 | 1 | 2 | 3 | 4 | 5;

export interface SuggestedCard {
  german: string;
  translation: string;
  translationLang: TranslationLang;
  type?: CardType;
}

export interface Card {
  id: string;
  userId: string;
  german: string;
  translation: string;
  translationLang: TranslationLang;
  type?: CardType;
  strength: CardStrength;
  dueDate: string; // ISO date string
  lastReviewedAt?: string;
  reviewCount: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  userId: string;
  title?: string;
  cardCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  settings: UserSettings;
}

export interface UserSettings {
  autoPlayAudio: boolean;
}

// API request/response shapes
export interface AnalyzeConversationRequest {
  text: string;
}

export interface AnalyzeConversationResponse {
  suggestions: SuggestedCard[];
}

export interface SaveCardsRequest {
  cards: SuggestedCard[];
  lessonTitle?: string;
}

export interface RateCardRequest {
  action: RatingAction;
}

export interface DashboardStats {
  totalCards: number;
  dueToday: number;
  newCards: number;
  learnedCards: number;
  needsReinforcement: number;
  totalLessons: number;
}
