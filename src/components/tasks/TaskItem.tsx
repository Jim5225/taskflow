import { motion } from 'framer-motion';
import { Check, Pencil, Trash2, Calendar, Clock } from 'lucide-react';
import type { Task } from '../../types';
import { cn } from '../../utils/cn';
import { PRIORITY_CONFIG } from '../../utils/constants';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const priorityConf = PRIORITY_CONFIG[task.priority];

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
        'bg-white dark:bg-surface-dark hover:shadow-card-hover',
        task.completed
          ? 'border-gray-100 dark:border-gray-800 opacity-60'
          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={cn(
          'flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all duration-300',
          task.completed
            ? 'bg-brand-500 border-brand-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
        )}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={12} className="text-white" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium transition-all',
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', priorityConf.bgClass)}>
            {priorityConf.label}
          </span>
          {task.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {isOverdue ? <Clock size={12} /> : <Calendar size={12} />}
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-hover text-gray-400 hover:text-brand-500 transition-colors"
          title="Edit task"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
