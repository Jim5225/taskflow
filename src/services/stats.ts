import { supabase } from '../lib/supabase';
import type { PomodoroSession, UserStats } from '../types';

// ============================================================
// Pomodoro Sessions
// ============================================================

export async function startPomodoroSession(
  userId: string,
  taskId: string | null,
  categoryId: string | null,
  duration: number,
  type: 'work' | 'short_break' | 'long_break'
): Promise<PomodoroSession> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: userId,
      task_id: taskId,
      category_id: categoryId,
      duration,
      type,
      completed: false,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completePomodoroSession(sessionId: string): Promise<PomodoroSession> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPomodoroSessions(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<PomodoroSession[]> {
  let query = supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'work')
    .order('started_at', { ascending: false });

  if (startDate) query = query.gte('started_at', startDate);
  if (endDate) query = query.lte('started_at', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTodayPomodoros(userId: string): Promise<PomodoroSession[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getPomodoroSessions(userId, today.toISOString());
}

// ============================================================
// User Stats
// ============================================================

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserStats(
  userId: string,
  updates: Partial<UserStats>
): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementXP(userId: string, xpAmount: number): Promise<UserStats> {
  // First get current stats
  const stats = await getUserStats(userId);
  const newXP = stats.xp + xpAmount;
  
  // Determine new level
  const levels = [
    { name: 'rookie', xp: 0 },
    { name: 'beginner', xp: 100 },
    { name: 'apprentice', xp: 300 },
    { name: 'intermediate', xp: 600 },
    { name: 'industrious', xp: 1000 },
    { name: 'expert', xp: 2000 },
    { name: 'master', xp: 4000 },
    { name: 'grandmaster', xp: 8000 },
  ];
  
  let newLevel = 'rookie';
  for (let i = levels.length - 1; i >= 0; i--) {
    if (newXP >= levels[i].xp) {
      newLevel = levels[i].name;
      break;
    }
  }

  return updateUserStats(userId, { xp: newXP, level: newLevel as UserStats['level'] });
}

export async function recordTaskCompletion(userId: string, isHighPriority: boolean, isUrgent: boolean) {
  const stats = await getUserStats(userId);
  let xpGain = 10; // base XP for task
  if (isHighPriority) xpGain += 5;
  if (isUrgent) xpGain += 10;

  const today = new Date().toISOString().split('T')[0];
  let newStreak = stats.current_streak;
  if (stats.last_active_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (stats.last_active_date === yesterdayStr) {
      newStreak += 1;
      xpGain += 5; // streak bonus
    } else {
      newStreak = 1;
    }
  }

  return updateUserStats(userId, {
    total_tasks_completed: stats.total_tasks_completed + 1,
    current_streak: newStreak,
    longest_streak: Math.max(stats.longest_streak, newStreak),
    xp: stats.xp + xpGain,
    last_active_date: today,
    level: getNewLevel(stats.xp + xpGain),
  });
}

export async function recordPomodoroCompletion(userId: string, durationMinutes: number) {
  const stats = await getUserStats(userId);
  const xpGain = 15;
  const today = new Date().toISOString().split('T')[0];
  
  let newStreak = stats.current_streak;
  if (stats.last_active_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    newStreak = stats.last_active_date === yesterdayStr ? newStreak + 1 : 1;
  }

  return updateUserStats(userId, {
    total_pomodoros_completed: stats.total_pomodoros_completed + 1,
    total_focus_minutes: stats.total_focus_minutes + durationMinutes,
    current_streak: newStreak,
    longest_streak: Math.max(stats.longest_streak, newStreak),
    xp: stats.xp + xpGain,
    last_active_date: today,
    level: getNewLevel(stats.xp + xpGain),
  });
}

function getNewLevel(xp: number): UserStats['level'] {
  const levels: { name: UserStats['level']; xp: number }[] = [
    { name: 'grandmaster', xp: 8000 },
    { name: 'master', xp: 4000 },
    { name: 'expert', xp: 2000 },
    { name: 'industrious', xp: 1000 },
    { name: 'intermediate', xp: 600 },
    { name: 'apprentice', xp: 300 },
    { name: 'beginner', xp: 100 },
    { name: 'rookie', xp: 0 },
  ];
  for (const level of levels) {
    if (xp >= level.xp) return level.name;
  }
  return 'rookie';
}
