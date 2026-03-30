import { supabase } from '../lib/supabase';
import type { PomodoroCategory, PomodoroCategoryFormData } from '../types';

export async function getCategories(userId: string): Promise<PomodoroCategory[]> {
  const { data, error } = await supabase
    .from('pomodoro_categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCategory(
  userId: string,
  data: PomodoroCategoryFormData
): Promise<PomodoroCategory> {
  const { data: newCategory, error } = await supabase
    .from('pomodoro_categories')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return newCategory;
}

export async function updateCategory(
  id: string,
  data: Partial<PomodoroCategoryFormData>
): Promise<PomodoroCategory> {
  const { data: updatedCategory, error } = await supabase
    .from('pomodoro_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updatedCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('pomodoro_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
