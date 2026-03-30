import { supabase } from '../lib/supabase';
import type { Habit, HabitLog, HabitFormData } from '../types';

export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getHabitLogs(userId: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createHabit(userId: string, habit: HabitFormData): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      title: habit.title.trim(),
      description: habit.description.trim(),
      icon: habit.icon,
      color: habit.color,
      target_days: habit.target_days,
      frequency: habit.frequency,
      reminder_time: habit.reminder_time,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);
  if (error) throw error;
}

export async function logHabitCompletion(userId: string, habitId: string, date: string): Promise<HabitLog> {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      user_id: userId,
      habit_id: habitId,
      completed_at: date,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeHabitLog(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_at', date);
  if (error) throw error;
}

export function subscribeToHabits(
  userId: string,
  callback: (payload: { eventType: string; table: string; new: any; old: any }) => void
) {
  return supabase
    .channel('habits-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          table: 'habits',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habit_logs',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          table: 'habit_logs',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();
}
