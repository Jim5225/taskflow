// ============================================================
// TickFlow — Type Definitions
// ============================================================

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type PomodoroType = 'work' | 'short_break' | 'long_break';
export type LevelName = 'rookie' | 'beginner' | 'apprentice' | 'intermediate' | 'industrious' | 'expert' | 'master' | 'grandmaster';
export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  quadrant: EisenhowerQuadrant;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  quadrant: EisenhowerQuadrant;
  due_date: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  duration: number;
  type: PomodoroType;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface UserStats {
  id: string;
  total_tasks_completed: number;
  total_pomodoros_completed: number;
  current_streak: number;
  longest_streak: number;
  total_focus_minutes: number;
  level: LevelName;
  xp: number;
  last_active_date: string | null;
  updated_at: string;
}

export interface LevelConfig {
  name: LevelName;
  title: string;
  xpRequired: number;
  badge: string;
  color: string;
}

export type FilterStatus = 'all' | 'active' | 'completed';
export type SortBy = 'created_at' | 'due_date' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  status: FilterStatus;
  priority: Priority | 'all';
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
}

export type ModalType = 'addTask' | 'editTask' | 'addHabit' | 'editHabit' | null;

export interface PomodoroState {
  isRunning: boolean;
  type: PomodoroType;
  timeLeft: number;
  totalTime: number;
  sessionsCompleted: number;
  currentTaskId: string | null;
}

// Eisenhower Matrix quadrant config
export interface QuadrantConfig {
  id: EisenhowerQuadrant;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
}

// Chart data types
export interface DailyChartData {
  name: string;
  completed: number;
  remaining: number;
}

export interface WeeklyChartData {
  day: string;
  pomodoros: number;
  tasks: number;
}

export interface MonthlyChartData {
  week: string;
  pomodoros: number;
  tasks: number;
  focusHours: number;
}

export interface YearlyChartData {
  month: string;
  pomodoros: number;
  tasks: number;
  focusHours: number;
}

// Habit Tracking Types
export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  target_days: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string; // ISO Date string (YYYY-MM-DD)
  created_at: string;
}

export interface HabitFormData {
  title: string;
  description: string;
  icon: string;
  color: string;
  target_days: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminder_time: string | null;
}

export interface HabitStats {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_rate: number;
  recent_logs: string[]; // Dates
}

