import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { cn } from '../../utils/cn';
import {
  getCurrentLevel,
  getNextLevel,
  getLevelProgress,
  LEVELS,
  PRIORITY_CONFIG,
} from '../../utils/constants';
import * as statsService from '../../services/stats';
import type { UserStats, PomodoroSession } from '../../types';
import {
  Trophy, Flame, Zap, Clock, Target, TrendingUp,
  Calendar, Award,
} from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths, startOfYear } from 'date-fns';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function StatisticsView() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pomodoros, setPomodoros] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userStats, sessions] = await Promise.all([
        statsService.getUserStats(user.id),
        statsService.getPomodoroSessions(user.id, subMonths(new Date(), 12).toISOString()),
      ]);
      setStats(userStats);
      setPomodoros(sessions);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== Chart Data =====================

  // DAILY - Pie chart: today's completed vs remaining tasks
  const getDailyData = useCallback(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = tasks.filter((t) => {
      const created = format(new Date(t.created_at), 'yyyy-MM-dd');
      return created === todayStr || (t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === todayStr);
    });
    const completed = todayTasks.filter((t) => t.completed).length;
    const remaining = todayTasks.filter((t) => !t.completed).length;
    const todayPomos = pomodoros.filter(
      (p) => p.completed && format(new Date(p.started_at), 'yyyy-MM-dd') === todayStr
    ).length;

    return {
      tasks: [
        { name: 'Completed', value: completed || 0, color: '#10B981' },
        { name: 'Remaining', value: remaining || 0, color: '#E5E7EB' },
      ],
      pomodoros: [
        { name: 'Completed', value: todayPomos || 0, color: '#6366F1' },
        { name: 'Remaining', value: Math.max(0, 8 - todayPomos), color: '#E5E7EB' },
      ],
      totalTasks: todayTasks.length,
      completedTasks: completed,
      completedPomos: todayPomos,
    };
  }, [tasks, pomodoros]);

  // WEEKLY - Bar chart
  const getWeeklyData = useCallback(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: today });

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(
        (t) => t.completed && format(new Date(t.updated_at), 'yyyy-MM-dd') === dayStr
      ).length;
      const dayPomos = pomodoros.filter(
        (p) => p.completed && format(new Date(p.started_at), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        day: format(day, 'EEE'),
        tasks: dayTasks,
        pomodoros: dayPomos,
      };
    });
  }, [tasks, pomodoros]);

  // MONTHLY - Trend line
  const getMonthlyData = useCallback(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: today });

    let cumTasks = 0;
    let cumPomos = 0;

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      cumTasks += tasks.filter(
        (t) => t.completed && format(new Date(t.updated_at), 'yyyy-MM-dd') === dayStr
      ).length;
      cumPomos += pomodoros.filter(
        (p) => p.completed && format(new Date(p.started_at), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        date: format(day, 'MMM dd'),
        tasks: cumTasks,
        pomodoros: cumPomos,
        focusHours: Math.round((cumPomos * 25) / 60 * 10) / 10,
      };
    });
  }, [tasks, pomodoros]);

  // YEARLY - Trend
  const getYearlyData = useCallback(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const months = eachMonthOfInterval({ start: yearStart, end: today });

    return months.map((month) => {
      const monthStr = format(month, 'yyyy-MM');
      const monthTasks = tasks.filter(
        (t) => t.completed && format(new Date(t.updated_at), 'yyyy-MM') === monthStr
      ).length;
      const monthPomos = pomodoros.filter(
        (p) => p.completed && format(new Date(p.started_at), 'yyyy-MM') === monthStr
      ).length;

      return {
        month: format(month, 'MMM'),
        tasks: monthTasks,
        pomodoros: monthPomos,
        focusHours: Math.round((monthPomos * 25) / 60 * 10) / 10,
      };
    });
  }, [tasks, pomodoros]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dailyData = getDailyData();
  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const yearlyData = getYearlyData();

  const level = stats ? getCurrentLevel(stats.xp) : LEVELS[0];
  const nextLevel = stats ? getNextLevel(stats.xp) : LEVELS[1];
  const progress = stats ? getLevelProgress(stats.xp) : 0;

  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;

  const tabs = [
    { id: 'daily' as const, label: 'Today' },
    { id: 'weekly' as const, label: 'Week' },
    { id: 'monthly' as const, label: 'Month' },
    { id: 'yearly' as const, label: 'Year' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Level Card */}
      <div className="bg-gradient-to-r from-brand-500 to-accent-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{level.badge}</span>
            <div>
              <h2 className="text-2xl font-bold">{level.title}</h2>
              <p className="text-white/70 text-sm">
                {stats?.xp || 0} XP earned
                {nextLevel && ` · ${nextLevel.xpRequired - (stats?.xp || 0)} XP to ${nextLevel.title}`}
              </p>
            </div>
          </div>
          <Award className="w-12 h-12 text-white/30" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Level badges */}
        <div className="flex items-center justify-between mt-4">
          {LEVELS.map((l) => (
            <div
              key={l.name}
              className={cn(
                'text-center transition-all',
                (stats?.xp || 0) >= l.xpRequired ? 'opacity-100' : 'opacity-30'
              )}
            >
              <span className="text-lg">{l.badge}</span>
              <p className="text-[10px] mt-0.5 hidden sm:block">{l.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Tasks Done', value: stats?.total_tasks_completed || 0, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
          { icon: Zap, label: 'Pomodoros', value: stats?.total_pomodoros_completed || 0, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { icon: Flame, label: 'Day Streak', value: stats?.current_streak || 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { icon: Clock, label: 'Focus Hours', value: Math.round((stats?.total_focus_minutes || 0) / 60), color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Task Completion Rate */}
      <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" />
            Task Completion Rate
          </h3>
          <span className="text-2xl font-bold text-brand-500">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
        </p>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-all relative',
                activeTab === tab.id
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* DAILY - Pie Charts */}
          {activeTab === 'daily' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Tasks ({dailyData.completedTasks}/{dailyData.totalTasks || '—'})
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={dailyData.tasks.filter(d => d.value > 0).length ? dailyData.tasks : [{ name: 'No data', value: 1, color: '#E5E7EB' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(dailyData.tasks.filter(d => d.value > 0).length ? dailyData.tasks : [{ name: 'No data', value: 1, color: '#E5E7EB' }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Pomodoros ({dailyData.completedPomos}/8 goal)
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={dailyData.pomodoros}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dailyData.pomodoros.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* WEEKLY - Bar chart */}
          {activeTab === 'weekly' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="tasks" fill="#10B981" radius={[6, 6, 0, 0]} name="Tasks" />
                <Bar dataKey="pomodoros" fill="#6366F1" radius={[6, 6, 0, 0]} name="Pomodoros" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* MONTHLY - Area chart (trend curve) */}
          {activeTab === 'monthly' && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPomos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="tasks" stroke="#10B981" fill="url(#gradTasks)" strokeWidth={2} name="Tasks (cumulative)" />
                <Area type="monotone" dataKey="pomodoros" stroke="#6366F1" fill="url(#gradPomos)" strokeWidth={2} name="Pomodoros (cumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* YEARLY - Line chart (trend curve) */}
          {activeTab === 'yearly' && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} name="Tasks" />
                <Line type="monotone" dataKey="pomodoros" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 4 }} name="Pomodoros" />
                <Line type="monotone" dataKey="focusHours" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} name="Focus Hours" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Longest Streak & Best Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Longest Streak</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.longest_streak || 0} days
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Focus Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {Math.round((stats?.total_focus_minutes || 0) / 60)}h {(stats?.total_focus_minutes || 0) % 60}m
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
