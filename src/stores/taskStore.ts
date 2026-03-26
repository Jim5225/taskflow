import { create } from 'zustand';
import type { Task, TaskFormData, FilterOptions, Priority } from '../types';
import * as taskService from '../services/tasks';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: FilterOptions;
  editingTask: Task | null;

  fetchTasks: (userId: string) => Promise<void>;
  addTask: (userId: string, task: TaskFormData) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleComplete: (taskId: string, completed: boolean) => Promise<void>;
  setEditingTask: (task: Task | null) => void;
  setFilter: (key: keyof FilterOptions, value: string) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;

  // Realtime sync helpers
  upsertTask: (task: Task) => void;
  deleteTaskLocal: (taskId: string) => void;

  // Computed
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  editingTask: null,
  filters: {
    status: 'all',
    priority: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    searchQuery: '',
  },

  fetchTasks: async (userId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getTasks(userId);
      set({ tasks, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      set({ loading: false, error: message });
    }
  },

  addTask: async (userId, task) => {
    set({ error: null });
    try {
      const newTask = await taskService.createTask(userId, task);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
      return newTask;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      set({ error: message });
      throw err;
    }
  },

  updateTask: async (taskId, updates) => {
    set({ error: null });
    try {
      const updated = await taskService.updateTask(taskId, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      set({ error: message });
      throw err;
    }
  },

  removeTask: async (taskId) => {
    set({ error: null });
    try {
      await taskService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      set({ error: message });
      throw err;
    }
  },

  toggleComplete: async (taskId, completed) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed } : t
      ),
    }));
    try {
      await taskService.toggleTaskComplete(taskId, completed);
    } catch (err: unknown) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !completed } : t
        ),
      }));
      const message = err instanceof Error ? err.message : 'Failed to update task';
      set({ error: message });
    }
  },

  setEditingTask: (task) => set({ editingTask: task }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),
  clearError: () => set({ error: null }),

  upsertTask: (task) =>
    set((state) => {
      const exists = state.tasks.find((t) => t.id === task.id);
      if (exists) {
        return { tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) };
      }
      return { tasks: [task, ...state.tasks] };
    }),

  deleteTaskLocal: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let filtered = [...tasks];

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (filters.status === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    // Search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'due_date':
          cmp = (a.due_date || '').localeCompare(b.due_date || '');
          break;
        case 'priority': {
          const order: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          cmp = order[a.priority] - order[b.priority];
          break;
        }
        default:
          cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return filters.sortOrder === 'desc' ? -cmp || cmp : cmp;
    });

    return filtered;
  },
}));
