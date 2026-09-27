import type {
  AnalyzeConversationResponse,
  Card,
  DashboardStats,
  Lesson,
  RatingAction,
  SaveCardsRequest,
  SuggestedCard,
  User,
} from '@german-app/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      request<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    login: (email: string, password: string) =>
      request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>('/auth/me'),
  },
  lessons: {
    analyze: (text: string) =>
      request<AnalyzeConversationResponse>('/lessons/analyze', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    save: (data: SaveCardsRequest) =>
      request<{ savedCount: number }>('/lessons/save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => request<Lesson[]>('/lessons'),
  },
  cards: {
    list: () => request<Card[]>('/cards'),
  },
  review: {
    getSession: () => request<Card[]>('/review/session'),
    getPracticeSession: (offset = 0) =>
      request<{ cards: Card[]; total: number; offset: number }>(`/review/practice?offset=${offset}`),
    rate: (cardId: string, action: RatingAction) =>
      request<Card>(`/review/${cardId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
  },
  stats: {
    get: () => request<DashboardStats>('/stats'),
  },
};

export type { SuggestedCard };
