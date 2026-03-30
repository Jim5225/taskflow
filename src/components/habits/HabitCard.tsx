import { 
  Target, Activity, Flame, Droplets, Heart, 
  Smile, Book, Sun, Moon, Zap, 
  Check, MoreVertical, Trash2, Edit2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { Habit } from '../../types';
import { useHabitStore } from '../../stores/habitStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { format, subDays } from 'date-fns';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
}

const ICON_MAP: Record<string, any> = {
  target: Target,
  activity: Activity,
  flame: Flame,
  droplets: Droplets,
  heart: Heart,
  smile: Smile,
  book: Book,
  sun: Sun,
  moon: Moon,
  zap: Zap,
};

export default function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { user } = useAuthStore();
  const { toggleHabit, deleteHabit, getHabitStats } = useHabitStore();
  const { openModal } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const stats = getHabitStats(habit.id);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isCompletedToday = stats.recent_logs.includes(today);
  const Icon = ICON_MAP[habit.icon] || Target;

  const progress = Math.min(Math.round((stats.total_completions / habit.target_days) * 100), 100);

  const handleToggle = async () => {
    if (!user || isToggling) return;
    setIsToggling(true);
    try {
      await toggleHabit(user.id, habit.id, today);
      if (!isCompletedToday) {
        toast.success(`Completed ${habit.title} for today!`, { icon: '✨' });
      }
    } catch {
      toast.error('Failed to update habit');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        await deleteHabit(habit.id);
        toast.success('Habit deleted');
      } catch {
        toast.error('Failed to delete habit');
      }
    }
  };

  // Generate last 7 days for activity indicator
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 bg-opacity-10 dark:bg-opacity-20"
          style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit(habit);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Habit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Habit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-500 transition-colors">
          {habit.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          {habit.description || 'No description'}
        </p>
      </div>

      {/* Progress & Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-orange-500 font-semibold">
            <Flame className="w-4 h-4 fill-current" />
            <span>{stats.current_streak} day streak</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {stats.total_completions} / {habit.target_days} days
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full transition-all duration-1000"
            style={{ backgroundColor: habit.color }}
          />
        </div>

        {/* Activity Grid (Mini) */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1">
            {last7Days.map((date) => {
              const completed = stats.recent_logs.includes(date);
              return (
                <div
                  key={date}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    completed 
                      ? 'scale-110 shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                  style={{ backgroundColor: completed ? habit.color : undefined }}
                  title={date}
                />
              );
            })}
          </div>
          
          <button
            onClick={handleToggle}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all transform active:scale-95 border-2',
              isCompletedToday
                ? 'bg-transparent text-gray-400 border-gray-100 dark:border-gray-800'
                : 'text-white shadow-lg border-transparent'
            )}
            style={{ 
              backgroundColor: isCompletedToday ? undefined : habit.color,
              boxShadow: isCompletedToday ? undefined : `0 8px 20px -6px ${habit.color}66`
            }}
          >
            {isCompletedToday ? (
              <>
                <Check size={18} className="stroke-[3px]" />
                Done
              </>
            ) : (
              'Check In'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
