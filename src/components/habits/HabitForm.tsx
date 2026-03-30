import { useState } from 'react';
import { 
  Target, Activity, Flame, Droplets, Heart, 
  Smile, Book, Sun, Moon, Zap, 
  Bell, Calendar, Clock, Tag, Type, AlignLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { HabitFormData } from '../../types';

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => void;
  onCancel: () => void;
  initialData?: HabitFormData;
  loading?: boolean;
  submitLabel?: string;
}

const ICONS = [
  { name: 'target', icon: Target },
  { name: 'activity', icon: Activity },
  { name: 'flame', icon: Flame },
  { name: 'droplets', icon: Droplets },
  { name: 'heart', icon: Heart },
  { name: 'smile', icon: Smile },
  { name: 'book', icon: Book },
  { name: 'sun', icon: Sun },
  { name: 'moon', icon: Moon },
  { name: 'zap', icon: Zap },
];

const COLORS = [
  { name: 'blue', value: '#3B82F6' },
  { name: 'green', value: '#10B981' },
  { name: 'red', value: '#EF4444' },
  { name: 'orange', value: '#F97316' },
  { name: 'purple', value: '#8B5CF6' },
  { name: 'pink', value: '#EC4899' },
  { name: 'cyan', value: '#06B6D4' },
  { name: 'yellow', value: '#F59E0B' },
];

export default function HabitForm({
  onSubmit,
  onCancel,
  initialData,
  loading,
  submitLabel = 'Save Habit',
}: HabitFormProps) {
  const [formData, setFormData] = useState<HabitFormData>(
    initialData || {
      title: '',
      description: '',
      icon: 'target',
      color: '#3B82F6',
      target_days: 30,
      frequency: 'daily',
      reminder_time: null,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-400" />
            Habit Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Wake up early, Drink water..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-gray-400" />
            Description (Optional)
          </label>
          <textarea
            placeholder="Why do you want to keep this habit?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none dark:text-white"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            Pick an Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: item.name })}
                  className={cn(
                    'flex items-center justify-center p-3 rounded-xl border transition-all',
                    formData.icon === item.name
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500 scale-105'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: formData.color }} />
            Theme Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={cn(
                  'h-8 rounded-lg flex items-center justify-center transition-all relative',
                  formData.color === color.value ? 'ring-2 ring-offset-2 ring-brand-500 scale-105' : 'hover:scale-105'
                )}
                style={{ backgroundColor: color.value }}
              >
                {formData.color === color.value && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Target Days */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Goal (Days)
            </label>
            <input
              type="number"
              min="1"
              max="3650"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
              value={formData.target_days}
              onChange={(e) => setFormData({ ...formData, target_days: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Reminder
            </label>
            <input
              type="time"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
              value={formData.reminder_time || ''}
              onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value || null })}
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Repeat Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['daily', 'weekly', 'monthly'].map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFormData({ ...formData, frequency: freq as any })}
                className={cn(
                  'px-4 py-2 rounded-xl border text-sm font-medium transition-all capitalize',
                  formData.frequency === freq
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-500'
                    : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                )}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2',
            loading && 'cursor-not-allowed'
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
