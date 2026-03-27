import { useState, useEffect } from 'react';
import type { TaskFormData, Priority, EisenhowerQuadrant } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, Flag, AlignLeft, Grid2x2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PRIORITY_CONFIG } from '../../utils/constants';
import { QUADRANT_CONFIG, autoDetectQuadrant } from '../../utils/eisenhower';
import { validateTaskTitle } from '../../utils/validators';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export default function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Create Task',
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrant>(initialData?.quadrant || 'schedule');
  const [quadrantOverridden, setQuadrantOverridden] = useState(!!initialData?.quadrant);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect quadrant whenever title, description, priority, or dueDate changes
  useEffect(() => {
    if (!quadrantOverridden) {
      const detected = autoDetectQuadrant(title, description, priority, dueDate || null);
      setQuadrant(detected);
    }
  }, [title, description, priority, dueDate, quadrantOverridden]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const titleErr = validateTaskTitle(title);
    if (titleErr) newErrors.title = titleErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({ title, description, priority, quadrant, due_date: dueDate });
  };

  const handleQuadrantChange = (q: EisenhowerQuadrant) => {
    setQuadrant(q);
    setQuadrantOverridden(true);
  };

  const handleResetQuadrant = () => {
    setQuadrantOverridden(false);
    const detected = autoDetectQuadrant(title, description, priority, dueDate || null);
    setQuadrant(detected);
  };

  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  const quadrants: EisenhowerQuadrant[] = ['do_first', 'schedule', 'delegate', 'eliminate'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Title"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <AlignLeft size={14} />
            Description
          </div>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <Flag size={14} />
            Priority
          </div>
        </label>
        <div className="flex gap-2">
          {priorities.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 border',
                priority === p
                  ? `${PRIORITY_CONFIG[p].bgClass} border-current`
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            Due Date
          </div>
        </label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
        />
      </div>

      {/* Eisenhower Quadrant Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <Grid2x2 size={14} />
              Eisenhower Matrix
            </div>
          </label>
          {quadrantOverridden && (
            <button
              type="button"
              onClick={handleResetQuadrant}
              className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              ↻ Auto-detect
            </button>
          )}
        </div>

        {!quadrantOverridden && title.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Auto-detected — click to override
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {quadrants.map((q) => {
            const config = QUADRANT_CONFIG[q];
            return (
              <button
                key={q}
                type="button"
                onClick={() => handleQuadrantChange(q)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border text-left',
                  quadrant === q
                    ? `${config.bgClass} ${config.borderClass} ring-1 ring-current/20`
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <span className="text-base">{config.icon}</span>
                <div>
                  <div className="font-semibold">{config.title}</div>
                  <div className="text-[10px] opacity-70">{config.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
