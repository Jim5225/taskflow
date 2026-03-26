import { useTaskStore } from '../../stores/taskStore';
import type { FilterStatus, Priority, SortBy } from '../../types';
import { cn } from '../../utils/cn';
import { Filter, ArrowUpDown } from 'lucide-react';

export default function TaskFilters() {
  const { filters, setFilter } = useTaskStore();

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
  ];

  const priorityOptions: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: '🔴 Urgent' },
    { value: 'high', label: '🟠 High' },
    { value: 'medium', label: '🔵 Medium' },
    { value: 'low', label: '⚪ Low' },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3">
      {/* Status tabs */}
      <div className="flex bg-gray-100 dark:bg-surface-dark-hover rounded-lg p-0.5">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter('status', opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              filters.status === opt.value
                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 focus:outline-none focus:border-brand-500"
        >
          {priorityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={14} className="text-gray-400" />
        <select
          value={filters.sortBy}
          onChange={(e) => setFilter('sortBy', e.target.value)}
          className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 focus:outline-none focus:border-brand-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
