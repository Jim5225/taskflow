import { useHabitStore } from '../../stores/habitStore';
import HabitCard from './HabitCard';
import EditHabitModal from './EditHabitModal';
import { Plus, Target } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Habit } from '../../types';

export default function HabitList() {
  const { habits, loading } = useHabitStore();
  const { openModal } = useUIStore();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 dark:bg-surface-dark-light rounded-3xl" />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 mb-4">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No habits yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs">
          Start your journey by adding your first habit. Consistency is key!
        </p>
        <button
          onClick={() => openModal('addHabit')}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={20} />
          Add First Habit
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <HabitCard 
            key={habit.id} 
            habit={habit} 
            onEdit={(h) => setEditingHabit(h)}
          />
        ))}
        
        {/* Add New Habit Button (Card Style) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('addHabit')}
          className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 hover:border-brand-500/30 hover:bg-brand-50/10 transition-all text-gray-400 hover:text-brand-500"
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-surface-dark-light flex items-center justify-center mb-4 group-hover:bg-brand-50">
            <Plus size={24} />
          </div>
          <span className="font-bold">Add New Habit</span>
        </motion.button>
      </div>

      <EditHabitModal 
        habit={editingHabit} 
        onClose={() => setEditingHabit(null)} 
      />
    </>
  );
}
