import { supabase } from '../lib/supabase';
import type { Task, TaskFormData } from '../types';

export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTask(userId: string, task: TaskFormData): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title.trim(),
      description: task.description.trim(),
      priority: task.priority,
      due_date: task.due_date || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
}

export async function toggleTaskComplete(taskId: string, completed: boolean): Promise<Task> {
  return updateTask(taskId, { completed });
}

export function subscribeToTasks(
  userId: string,
  callback: (payload: { eventType: string; new: Task; old: Task }) => void
) {
  return supabase
    .channel('tasks-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Task,
          old: payload.old as Task,
        });
      }
    )
    .subscribe();
}
