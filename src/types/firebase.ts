export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  points: number;
  level: number;
  streak: number;
  lastActive: string;
  dailyXP: number;
  lastGoalReset: string;
  badges: string[];
  unlockedDecks: string[];
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  difficulty: number;
  minLevel: number;
  ownerId?: string | null;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  imageUrl?: string;
  ownerId?: string | null;
}

export interface CardProgress {
  userId: string;
  cardId: string;
  deckId: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: string;
  lastReviewed: string;
}
