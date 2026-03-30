import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useHabitStore } from '../../stores/habitStore';
import { format, subDays, eachDayOfInterval, isSameDay, subMonths, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Target, Activity, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export default function HabitStatistics() {
  const { logs, habits } = useHabitStore();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  // 1. Chart Data based on timeframe
  let chartData = [];
  if (timeframe === 'weekly') {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    chartData = last7Days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE');
      const count = logs.filter((l) => l.completed_at === dateStr).length;
      return { name: label, count };
    });
  } else {
    // Last 30 days grouped by week or just daily for better resolution?
    // Let's do last 30 days daily but with fewer labels
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    chartData = last30Days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'MMM d');
      const count = logs.filter((l) => l.completed_at === dateStr).length;
      return { name: label, count };
    });
  }

  // 2. Success Rate Data (All time)
  const totalHabits = habits.length;
  const totalPotentialCompletions = habits.reduce((acc, h) => acc + h.target_days, 0);
  const actualCompletions = logs.length;
  
  const successData = [
    { name: 'Completed', value: actualCompletions, color: '#3B82F6' },
    { name: 'Remaining', value: Math.max(0, totalPotentialCompletions - actualCompletions), color: '#E5E7EB66' }
  ];

  if (habits.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Weekly Activity Bar Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-500">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Activity Trend</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completions across all habits</p>
            </div>
          </div>

          <div className="flex items-center bg-gray-50 dark:bg-surface-dark-light p-1 rounded-xl border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setTimeframe('weekly')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                timeframe === 'weekly' 
                  ? 'bg-white dark:bg-surface-dark text-brand-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                timeframe === 'monthly' 
                  ? 'bg-white dark:bg-surface-dark text-brand-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB33" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                dy={10}
                interval={timeframe === 'monthly' ? 4 : 0}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  backgroundColor: '#1F2937',
                  color: '#fff'
                }}
                itemStyle={{ color: '#60A5FA' }}
              />
              <Bar 
                dataKey="count" 
                fill="#3B82F6" 
                radius={[6, 6, 0, 0]} 
                barSize={timeframe === 'weekly' ? 32 : 12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-50 dark:bg-accent-500/10 rounded-xl text-accent-500">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Quick Stats</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-light border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-light border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Habits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{habits.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-500/5 border border-brand-500/10">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Top Performer</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {habits[0]?.title || 'None yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Progress</span>
            <span className="text-sm font-bold text-brand-500">
              {Math.round((actualCompletions / (totalPotentialCompletions || 1)) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.round((actualCompletions / (totalPotentialCompletions || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
