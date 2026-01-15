
import { Rank } from './types';

export const RANK_THRESHOLDS = [
  { label: Rank.XuấtSắc, min: 9 },
  { label: Rank.Tốt, min: 8 },
  { label: Rank.Khá, min: 6.5 },
  { label: Rank.Đạt, min: 5 },
  { label: Rank.Yếu, min: 3.5 },
  { label: Rank.Kém, min: 0 },
];

export const getRank = (score: number): Rank => {
  for (const threshold of RANK_THRESHOLDS) {
    if (score >= threshold.min) return threshold.label;
  }
  return Rank.Kém;
};

export const RANK_COLORS: Record<Rank, string> = {
  [Rank.XuấtSắc]: '#1D4ED8', // blue-700
  [Rank.Tốt]: '#059669',    // emerald-600
  [Rank.Khá]: '#D97706',    // amber-600
  [Rank.Đạt]: '#6366F1',    // indigo-500
  [Rank.Yếu]: '#EA580C',    // orange-600
  [Rank.Kém]: '#DC2626',    // red-600
};
