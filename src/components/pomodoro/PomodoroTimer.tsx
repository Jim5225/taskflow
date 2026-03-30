import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Timer, Pencil, Trash2, Plus } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore, subscribeToCategories } from '../../stores/categoryStore';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import * as statsService from '../../services/stats';
import CategoryModal from './CategoryModal';

export default function PomodoroTimer() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { categories, fetchCategories, deleteCategory, upsertCategoryLocal, deleteCategoryLocal, setSelectedCategoryForEdit } = useCategoryStore();
  
  const {
    pomodoro,
    startPomodoro,
    pausePomodoro,
    tickPomodoro,
    completePomodoro,
    resetPomodoro,
    skipToBreak,
    skipToWork,
    openModal,
  } = useUIStore();

  const [activeTab, setActiveTab] = useState<'tasks' | 'categories'>('tasks');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const activeTasks = tasks.filter((t) => !t.completed);

  // Timer tick
  useEffect(() => {
    if (pomodoro.isRunning) {
      intervalRef.current = setInterval(() => {
        tickPomodoro();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoro.isRunning, tickPomodoro]);

  // Handle timer complete
  useEffect(() => {
    if (pomodoro.timeLeft === 0 && pomodoro.isRunning) {
      handleTimerComplete();
    }
  }, [pomodoro.timeLeft]);

  const handleTimerComplete = useCallback(async () => {
    if (pomodoro.type === 'work' && user) {
      // Record completed pomodoro
      try {
        if (sessionIdRef.current) {
          await statsService.completePomodoroSession(sessionIdRef.current);
        }
        await statsService.recordPomodoroCompletion(user.id, pomodoro.totalTime / 60);
        toast.success('🎉 Pomodoro completed! Great focus!', { duration: 4000 });
      } catch {
        // Silent fail for stats
      }
      sessionIdRef.current = null;
    } else if (pomodoro.type !== 'work') {
      toast('Break is over! Time to focus 💪', { icon: '⏰', duration: 3000 });
    }
    completePomodoro();

    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGiRar9/JjEIaABx0wuHHZyMPADB+1e3DUhgFEFuW4+ycOAkAOojb8cxMDwI7f8fy');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Silent
    }
  }, [pomodoro.type, pomodoro.totalTime, user, completePomodoro]);

  // Fetch categories & subscribe
  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
      const channel = subscribeToCategories(user.id, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          upsertCategoryLocal(payload.new);
        } else if (payload.eventType === 'DELETE') {
          deleteCategoryLocal(payload.old.id);
        }
      });
      return () => { channel.unsubscribe(); };
    }
  }, [user]);

  const handleStart = async () => {
    if (pomodoro.type === 'work' && user) {
      try {
        const session = await statsService.startPomodoroSession(
          user.id,
          pomodoro.currentTaskId,
          pomodoro.currentCategoryId,
          pomodoro.totalTime / 60,
          'work'
        );
        sessionIdRef.current = session.id;
      } catch {
        // Continue without tracking
      }
    }
    startPomodoro(pomodoro.currentTaskId, pomodoro.currentCategoryId);
  };

  const handleSelectTask = (taskId: string) => {
    startPomodoro(taskId, null);
    pausePomodoro();
  };

  const handleSelectCategory = (categoryId: string) => {
    startPomodoro(null, categoryId);
    pausePomodoro();
  };

  // Format time
  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const progress = ((pomodoro.totalTime - pomodoro.timeLeft) / pomodoro.totalTime) * 100;

  // Colors per type
  const typeColors = {
    work: { ring: '#6366F1', bg: 'from-brand-500/10 to-accent-500/10', label: 'Focus Time' },
    short_break: { ring: '#10B981', bg: 'from-green-500/10 to-emerald-500/10', label: 'Short Break' },
    long_break: { ring: '#3B82F6', bg: 'from-blue-500/10 to-cyan-500/10', label: 'Long Break' },
  };

  const currentColor = typeColors[pomodoro.type];
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentTask = activeTasks.find((t) => t.id === pomodoro.currentTaskId);
  const currentCategory = categories.find((c) => c.id === pomodoro.currentCategoryId);

  return (
    <div className="flex flex-col items-center py-8 px-6">
      {/* Session type label */}
      <motion.div
        key={pomodoro.type}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className={cn(
          'px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r',
          currentColor.bg,
          'text-gray-700 dark:text-gray-200'
        )}>
          {currentColor.label}
        </span>
      </motion.div>

      {/* Timer circle */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-200 dark:text-gray-800"
          />
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke={currentColor.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Session {pomodoro.sessionsCompleted + 1}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={resetPomodoro}
          className="p-3 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-all"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={pomodoro.isRunning ? pausePomodoro : handleStart}
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all',
            pomodoro.isRunning
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700'
          )}
        >
          {pomodoro.isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </motion.button>

        <button
          onClick={pomodoro.type === 'work' ? skipToBreak : skipToWork}
          className="p-3 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-all"
          title="Skip"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Current selection */}
      {(currentTask || currentCategory) && (
        <div className="text-center mb-6 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 inline-flex items-center gap-2 max-w-sm">
          {currentCategory && (
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: currentCategory.color }} />
          )}
          <div className="flex-1 truncate">
            <p className="text-xs text-gray-500 dark:text-gray-400">Focusing on</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {currentTask ? currentTask.title : currentCategory?.name}
            </p>
          </div>
        </div>
      )}

      {/* Selector Tabs */}
      <div className="w-full max-w-sm">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
              activeTab === 'tasks' ? "bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
              activeTab === 'categories' ? "bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Categories
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'tasks' ? (
            activeTasks.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                No active tasks. Create one first!
              </p>
            ) : (
              activeTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                    pomodoro.currentTaskId === task.id
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover'
                  )}
                >
                  {task.title}
                </button>
              ))
            )
          ) : (
            <>
              {categories.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  No categories yet. Create your first target!
                </p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="group flex items-center gap-2 w-full">
                  <button
                    onClick={() => handleSelectCategory(cat.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-all',
                      pomodoro.currentCategoryId === cat.id
                        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover'
                    )}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    {cat.target_sessions > 0 && (
                      <span className="text-xs font-medium text-gray-400 shrink-0">
                        Target: {cat.target_sessions}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryForEdit(cat);
                      openModal('editCategory');
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-all font-medium"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this category?')) deleteCategory(cat.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all font-medium"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => openModal('addCategory')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors border border-dashed border-gray-200 dark:border-gray-800"
              >
                <Plus size={16} /> Add Category
              </button>
            </>
          )}
        </div>
      </div>

      <CategoryModal />

      {/* Sessions indicator */}
      <div className="flex items-center gap-2 mt-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              i < (pomodoro.sessionsCompleted % 4)
                ? 'bg-brand-500'
                : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1">
          {4 - (pomodoro.sessionsCompleted % 4)} until long break
        </span>
      </div>
    </div>
  );
}
