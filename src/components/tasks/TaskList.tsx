import { AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';
import TaskFilters from './TaskFilters';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useTaskStore } from '../../stores/taskStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import type { Task } from '../../types';
import { ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import * as statsService from '../../services/stats';

export default function TaskList() {
  const { loading, getFilteredTasks, toggleComplete, removeTask, setEditingTask, filters } =
    useTaskStore();
  const { user } = useAuthStore();
  const { openModal } = useUIStore();

  const tasks = getFilteredTasks();

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    openModal('editTask');
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      await removeTask(taskId);
    }
  };

  const handleToggle = async (taskId: string, completed: boolean) => {
    await toggleComplete(taskId, completed);

    // If marking complete, record for stats + XP
    if (completed && user) {
      const task = tasks.find((t) => t.id === taskId);
      try {
        await statsService.recordTaskCompletion(
          user.id,
          task?.priority === 'high',
          task?.priority === 'urgent'
        );
        toast.success('Task completed! +XP 🎉', { duration: 2000 });
      } catch {
        // Stats update failed silently — task is still toggled
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div>
      <TaskFilters />

      {/* Stats bar */}
      {totalCount > 0 && (
        <div className="px-6 py-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{totalCount} task{totalCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <ListChecks size={12} />
            {completedCount} completed
          </span>
          {totalCount > 0 && (
            <div className="flex-1 max-w-32">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task list */}
      <div className="px-6 pb-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title={filters.searchQuery ? 'No matching tasks' : 'No tasks yet'}
            message={
              filters.searchQuery
                ? `No tasks match "${filters.searchQuery}". Try a different search.`
                : 'Create your first task and start being productive!'
            }
            actionLabel={filters.searchQuery ? undefined : 'Create Task'}
            onAction={filters.searchQuery ? undefined : () => openModal('addTask')}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
