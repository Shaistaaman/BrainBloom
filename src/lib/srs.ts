import { addDays } from 'date-fns';

export interface SRSState {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: Date;
}

/**
 * Calculates updated Spaced Repetition state based on user feedback.
 * feedback: 0 (forgot), 1 (struggled), 2 (easy)
 */
export function calculateNextReview(
  state: SRSState | null,
  feedback: 0 | 1 | 2
): SRSState {
  let { interval, repetitions, easeFactor } = state || {
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
  };

  // Convert 0/1/2 to SM2 quality (0-5)
  // Our system simplifies: 0 -> 1, 1 -> 3, 2 -> 5
  const quality = feedback === 0 ? 1 : feedback === 1 ? 3 : 5;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 4; // Duolingo style: slightly faster early reviews
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return {
    interval,
    repetitions,
    easeFactor,
    nextReview: addDays(new Date(), interval),
  };
}

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 50)) + 1;
}

export function pointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  const nextLevelPoints = Math.pow(currentLevel, 2) * 50;
  return nextLevelPoints - points;
}

export function calculateStreak(lastActiveStr: string | null, currentStreak: number): number {
  if (!lastActiveStr) return 1;
  
  const now = new Date();
  const lastActive = new Date(lastActiveStr);
  
  // Set times to midnight to compare only dates
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  const diffInDays = Math.floor((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Already active today, keep streak
    return Math.max(currentStreak, 1);
  } else if (diffInDays === 1) {
    // Was active yesterday, increment streak
    return currentStreak + 1;
  } else {
    // Missed a day or more, reset to 1
    return 1;
  }
}
