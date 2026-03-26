import type { LevelConfig } from '../types';

export const POMODORO_WORK_DURATION = 25 * 60; // 25 minutes in seconds
export const POMODORO_SHORT_BREAK = 5 * 60; // 5 minutes
export const POMODORO_LONG_BREAK = 15 * 60; // 15 minutes
export const POMODORO_SESSIONS_BEFORE_LONG_BREAK = 4;

export const LEVELS: LevelConfig[] = [
  { name: 'rookie', title: 'Rookie', xpRequired: 0, badge: '🌱', color: '#9CA3AF' },
  { name: 'beginner', title: 'Beginner', xpRequired: 100, badge: '🌿', color: '#10B981' },
  { name: 'apprentice', title: 'Apprentice', xpRequired: 300, badge: '🎯', color: '#3B82F6' },
  { name: 'intermediate', title: 'Intermediate', xpRequired: 600, badge: '⚡', color: '#F59E0B' },
  { name: 'industrious', title: 'Industrious', xpRequired: 1000, badge: '🔥', color: '#F97316' },
  { name: 'expert', title: 'Expert', xpRequired: 2000, badge: '💎', color: '#8B5CF6' },
  { name: 'master', title: 'Master', xpRequired: 4000, badge: '👑', color: '#EF4444' },
  { name: 'grandmaster', title: 'Grandmaster', xpRequired: 8000, badge: '🏆', color: '#FFD700' },
];

export const XP_REWARDS = {
  taskComplete: 10,
  pomodoroComplete: 15,
  dailyStreak: 5,
  highPriorityBonus: 5,
  urgentPriorityBonus: 10,
};

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#EF4444', bgClass: 'bg-red-500/10 text-red-500 dark:text-red-400' },
  high: { label: 'High', color: '#F97316', bgClass: 'bg-orange-500/10 text-orange-500 dark:text-orange-400' },
  medium: { label: 'Medium', color: '#3B82F6', bgClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-400' },
  low: { label: 'Low', color: '#9CA3AF', bgClass: 'bg-gray-500/10 text-gray-500 dark:text-gray-400' },
};

export function getCurrentLevel(xp: number): LevelConfig {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number): LevelConfig | null {
  const current = getCurrentLevel(xp);
  const idx = LEVELS.findIndex(l => l.name === current.name);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(xp: number): number {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.xpRequired - current.xpRequired;
  const progress = xp - current.xpRequired;
  return Math.min(Math.round((progress / range) * 100), 100);
}
