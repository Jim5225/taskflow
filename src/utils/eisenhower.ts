import type { EisenhowerQuadrant, Priority, QuadrantConfig } from '../types';

// ============================================================
// Eisenhower Matrix Quadrant Configuration
// ============================================================

export const QUADRANT_CONFIG: Record<EisenhowerQuadrant, QuadrantConfig> = {
  do_first: {
    id: 'do_first',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    icon: '🔥',
    color: '#EF4444',
    bgClass: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-500/30',
  },
  schedule: {
    id: 'schedule',
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    icon: '📅',
    color: '#3B82F6',
    bgClass: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-500/30',
  },
  delegate: {
    id: 'delegate',
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    icon: '👥',
    color: '#F59E0B',
    bgClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
  },
  eliminate: {
    id: 'eliminate',
    title: 'Eliminate',
    subtitle: 'Not Urgent, Not Important',
    icon: '🗑️',
    color: '#6B7280',
    bgClass: 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400',
    borderClass: 'border-gray-200 dark:border-gray-500/30',
  },
};

// ============================================================
// Keyword dictionaries for smarter classification
// ============================================================

const URGENT_KEYWORDS = [
  'asap', 'urgent', 'emergency', 'critical', 'deadline', 'overdue',
  'immediately', 'now', 'today', 'tonight', 'rush', 'hurry',
  'last chance', 'final', 'expiring', 'due now', 'right away',
  'crisis', 'fire', 'broken', 'down', 'outage', 'bug fix',
  'hotfix', 'patch', 'blocker',
];

const IMPORTANT_KEYWORDS = [
  'important', 'review', 'plan', 'strategy', 'meeting', 'project',
  'report', 'presentation', 'proposal', 'budget', 'research',
  'study', 'learn', 'course', 'exam', 'test', 'assignment',
  'homework', 'thesis', 'dissertation', 'paper', 'write',
  'design', 'architect', 'build', 'develop', 'implement',
  'health', 'exercise', 'doctor', 'workout', 'goal',
  'career', 'interview', 'resume', 'portfolio', 'skill',
  'client', 'customer', 'contract', 'invoice', 'payment',
  'deploy', 'release', 'launch', 'milestone',
];

const NOT_IMPORTANT_KEYWORDS = [
  'maybe', 'someday', 'browse', 'scroll', 'watch', 'movie',
  'social media', 'instagram', 'tiktok', 'youtube', 'netflix',
  'game', 'gaming', 'gossip', 'meme', 'funny',
  'random', 'misc', 'miscellaneous', 'trivial', 'minor',
  'nice to have', 'optional', 'low priority', 'whenever',
  'shopping', 'sale', 'discount',
];

// ============================================================
// Smart Auto-Detection
// ============================================================

export function autoDetectQuadrant(
  title: string,
  description: string,
  priority: Priority,
  dueDate: string | null
): EisenhowerQuadrant {
  const text = `${title} ${description}`.toLowerCase();

  // — Urgency score (0–10) —
  let urgencyScore = 0;

  // Priority contributes to urgency
  if (priority === 'urgent') urgencyScore += 8;
  else if (priority === 'high') urgencyScore += 5;
  else if (priority === 'medium') urgencyScore += 2;
  else urgencyScore += 0;

  // Due date urgency
  if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) urgencyScore += 10; // Overdue!
    else if (hoursUntilDue < 6) urgencyScore += 8;
    else if (hoursUntilDue < 24) urgencyScore += 6;
    else if (hoursUntilDue < 48) urgencyScore += 4;
    else if (hoursUntilDue < 168) urgencyScore += 2; // Within a week
  }

  // Keyword urgency boost
  for (const keyword of URGENT_KEYWORDS) {
    if (text.includes(keyword)) {
      urgencyScore += 3;
      break;
    }
  }

  // — Importance score (0–10) —
  let importanceScore = 0;

  // Priority contributes to importance
  if (priority === 'urgent') importanceScore += 6;
  else if (priority === 'high') importanceScore += 7;
  else if (priority === 'medium') importanceScore += 4;
  else importanceScore += 1;

  // Keyword importance boost
  for (const keyword of IMPORTANT_KEYWORDS) {
    if (text.includes(keyword)) {
      importanceScore += 3;
      break;
    }
  }

  // Not-important keyword penalty
  for (const keyword of NOT_IMPORTANT_KEYWORDS) {
    if (text.includes(keyword)) {
      importanceScore -= 3;
      break;
    }
  }

  // Clamp scores
  urgencyScore = Math.max(0, Math.min(10, urgencyScore));
  importanceScore = Math.max(0, Math.min(10, importanceScore));

  // — Classify into quadrant —
  const isUrgent = urgencyScore >= 5;
  const isImportant = importanceScore >= 5;

  if (isUrgent && isImportant) return 'do_first';
  if (!isUrgent && isImportant) return 'schedule';
  if (isUrgent && !isImportant) return 'delegate';
  return 'eliminate';
}
