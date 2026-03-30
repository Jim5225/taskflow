import { create } from 'zustand';
import type { PomodoroCategory, PomodoroCategoryFormData } from '../types';
import * as categoryService from '../services/categories';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CategoryState {
  categories: PomodoroCategory[];
  isLoading: boolean;
  error: string | null;
  selectedCategoryForEdit: PomodoroCategory | null;
  
  fetchCategories: (userId: string) => Promise<void>;
  addCategory: (userId: string, data: PomodoroCategoryFormData) => Promise<void>;
  updateCategory: (id: string, data: Partial<PomodoroCategoryFormData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSelectedCategoryForEdit: (category: PomodoroCategory | null) => void;
  
  // Local optimistic updates for realtime sync
  upsertCategoryLocal: (category: PomodoroCategory) => void;
  deleteCategoryLocal: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  selectedCategoryForEdit: null,

  fetchCategories: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryService.getCategories(userId);
      set({ categories, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to load categories');
    }
  },

  addCategory: async (userId, data) => {
    set({ isLoading: true, error: null });
    try {
      const newCategory = await categoryService.createCategory(userId, data);
      get().upsertCategoryLocal(newCategory);
      set({ isLoading: false });
      toast.success('Category created!');
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to create category');
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCategory = await categoryService.updateCategory(id, data);
      get().upsertCategoryLocal(updatedCategory);
      set({ isLoading: false, selectedCategoryForEdit: null });
      toast.success('Category updated!');
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to update category');
    }
  },

  deleteCategory: async (id) => {
    try {
      await categoryService.deleteCategory(id);
      get().deleteCategoryLocal(id);
      toast.success('Category deleted');
    } catch (error: any) {
      toast.error('Failed to delete category');
    }
  },

  setSelectedCategoryForEdit: (category) => set({ selectedCategoryForEdit: category }),

  upsertCategoryLocal: (category) =>
    set((state) => {
      const exists = state.categories.some((c) => c.id === category.id);
      if (exists) {
        return {
          categories: state.categories.map((c) =>
            c.id === category.id ? category : c
          ),
        };
      }
      return { categories: [...state.categories, category] };
    }),

  deleteCategoryLocal: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));

export function subscribeToCategories(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('pomodoro_categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pomodoro_categories',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
