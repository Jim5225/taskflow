import { useEffect } from 'react';
import { Plus, Bell, Target, Calendar, CheckCircle2, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import HabitList from './HabitList';
import HabitStatistics from './HabitStatistics';
import AddHabitModal from './AddHabitModal';
import { useHabitStore } from '../../stores/habitStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import * as habitService from '../../services/habits';
import { motion } from 'framer-motion';

export default function HabitsView() {
  const { user } = useAuthStore();
  const { fetchHabits, upsertHabitLocal, deleteHabitLocal, upsertLogLocal, deleteLogLocal, habits } = useHabitStore();
  const { openModal } = useUIStore();

  useEffect(() => {
    if (user) {
      fetchHabits(user.id);
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = habitService.subscribeToHabits(user.id, (payload) => {
      if (payload.table === 'habits') {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          upsertHabitLocal(payload.new);
        } else if (payload.eventType === 'DELETE') {
          deleteHabitLocal(payload.old.id);
        }
      } else if (payload.table === 'habit_logs') {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          upsertLogLocal(payload.new);
        } else if (payload.eventType === 'DELETE') {
          deleteLogLocal(payload.old.habit_id, payload.old.completed_at);
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification("TickFlow Test", {
        body: "Notifications are working! ✨",
      });
    } else {
      toast.error("Please enable notifications first!");
    }
  };

  // Filter habits that have reminders set
  const reminders = habits.filter(h => h.reminder_time).sort((a,b) => (a.reminder_time || '').localeCompare(b.reminder_time || ''));

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Habits</h2>
          <p className="text-gray-500 dark:text-gray-400">Track your consistency and reach your long-term goals.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={sendTestNotification}
            className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors"
            title="Test Notification"
          >
            <Play size={20} />
          </button>
          <button
            onClick={() => {
              if (Notification.permission !== 'granted') {
                Notification.requestPermission();
              }
            }}
            className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors"
            title="Enable Notifications"
          >
            <Bell size={20} />
          </button>
          
          <button
            onClick={() => openModal('addHabit')}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <Plus size={20} />
            New Habit
          </button>
        </div>
      </div>

      <HabitStatistics />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main List */}
        <div className="xl:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Current Habits</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-400">
              {habits.length}
            </span>
          </div>
          <HabitList />
        </div>

        {/* Sidebar Status / Reminders */}
        <div className="space-y-8">
          {/* Reminders Section */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-500">
                <Bell size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Reminders</h3>
            </div>
            
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reminders set for any habits.</p>
              ) : (
                reminders.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-surface-dark-light border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: h.color }}>
                        <Target size={14} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{h.title}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-2 py-1 rounded-lg">
                      {h.reminder_time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-white relative overflow-hidden shadow-xl shadow-brand-500/10">
            <div className="relative z-10">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 size={18} />
                Stay Consistent
              </h4>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
              </p>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                <Calendar size={14} />
                Streak Bonus: +5 XP
              </div>
            </div>
            {/* Background design */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>

      <AddHabitModal />
    </div>
  );
}
