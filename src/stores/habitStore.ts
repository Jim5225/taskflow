import { create } from 'zustand';
import type { Habit, HabitLog, HabitFormData, HabitStats } from '../types';
import * as habitService from '../services/habits';
import { differenceInDays, format, parseISO, subDays } from 'date-fns';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  loading: boolean;
  error: string | null;

  fetchHabits: (userId: string) => Promise<void>;
  addHabit: (userId: string, habit: HabitFormData) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabit: (userId: string, habitId: string, date: string) => Promise<void>;
  
  // Local state updates for realtime
  upsertHabitLocal: (habit: Habit) => void;
  deleteHabitLocal: (habitId: string) => void;
  upsertLogLocal: (log: HabitLog) => void;
  deleteLogLocal: (habitId: string, date: string) => void;

  getHabitStats: (habitId: string) => HabitStats;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: [],
  loading: false,
  error: null,

  fetchHabits: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const [habits, logs] = await Promise.all([
        habitService.getHabits(userId),
        habitService.getHabitLogs(userId)
      ]);
      set({ habits, logs, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addHabit: async (userId: string, habit: HabitFormData) => {
    try {
      const newHabit = await habitService.createHabit(userId, habit);
      set((state) => ({ habits: [newHabit, ...state.habits] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateHabit: async (habitId: string, updates: Partial<Habit>) => {
    try {
      const updatedHabit = await habitService.updateHabit(habitId, updates);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? updatedHabit : h)),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteHabit: async (habitId: string) => {
    try {
      await habitService.deleteHabit(habitId);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== habitId),
        logs: state.logs.filter((l) => l.habit_id !== habitId),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  toggleHabit: async (userId: string, habitId: string, date: string) => {
    const { logs } = get();
    const existingLog = logs.find((l) => l.habit_id === habitId && l.completed_at === date);

    try {
      if (existingLog) {
        await habitService.removeHabitLog(habitId, date);
        set((state) => ({
          logs: state.logs.filter((l) => !(l.habit_id === habitId && l.completed_at === date)),
        }));
      } else {
        const newLog = await habitService.logHabitCompletion(userId, habitId, date);
        set((state) => ({ logs: [newLog, ...state.logs] }));
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  upsertHabitLocal: (habit) =>
    set((state) => ({
      habits: state.habits.some((h) => h.id === habit.id)
        ? state.habits.map((h) => (h.id === habit.id ? habit : h))
        : [habit, ...state.habits],
    })),

  deleteHabitLocal: (habitId) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
      logs: state.logs.filter((l) => l.habit_id !== habitId),
    })),

  upsertLogLocal: (log) =>
    set((state) => ({
      logs: state.logs.some((l) => l.id === log.id)
        ? state.logs.map((l) => (l.id === log.id ? log : l))
        : [log, ...state.logs],
    })),

  deleteLogLocal: (habitId, date) =>
    set((state) => ({
      logs: state.logs.filter((l) => !(l.habit_id === habitId && l.completed_at === date)),
    })),

  getHabitStats: (habitId) => {
    const { logs, habits } = get();
    const habit = habits.find((h) => h.id === habitId);
    const habitLogs = logs
      .filter((l) => l.habit_id === habitId)
      .map((l) => l.completed_at)
      .sort((a, b) => b.localeCompare(a)); // Newest first

    if (!habit) {
      return {
        habit_id: habitId,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completion_rate: 0,
        recent_logs: [],
      };
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Total completions
    const totalCompletions = habitLogs.length;

    // Completion rate (since habit created)
    const daysSinceCreated = Math.max(1, differenceInDays(new Date(), parseISO(habit.created_at)) + 1);
    const completionRate = Math.round((totalCompletions / daysSinceCreated) * 100);

    // Current streak
    if (habitLogs.includes(today) || habitLogs.includes(yesterday)) {
      let checkDate = habitLogs.includes(today) ? new Date() : subDays(new Date(), 1);
      while (habitLogs.includes(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // Longest streak (this is a simplified version)
    // To do it properly we'd iterate through all logs, but for performance we'll just track the max found
    const sortedLogs = [...habitLogs].sort((a, b) => a.localeCompare(b));
    if (sortedLogs.length > 0) {
      let maxS = 1;
      let currS = 1;
      for (let i = 1; i < sortedLogs.length; i++) {
        const d1 = parseISO(sortedLogs[i - 1]);
        const d2 = parseISO(sortedLogs[i]);
        if (differenceInDays(d2, d1) === 1) {
          currS++;
        } else {
          maxS = Math.max(maxS, currS);
          currS = 1;
        }
      }
      longestStreak = Math.max(maxS, currS);
    }

    return {
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_completions: totalCompletions,
      completion_rate: completionRate,
      recent_logs: habitLogs.slice(0, 7),
    };
  },
}));
