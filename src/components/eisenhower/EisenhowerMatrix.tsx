import { AnimatePresence } from 'framer-motion';
import TaskItem from '../tasks/TaskItem';
import { useTaskStore } from '../../stores/taskStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { QUADRANT_CONFIG } from '../../utils/eisenhower';
import { cn } from '../../utils/cn';
import type { EisenhowerQuadrant, Task } from '../../types';
import * as statsService from '../../services/stats';
import toast from 'react-hot-toast';

export default function EisenhowerMatrix() {
  const { tasks, toggleComplete, removeTask, setEditingTask } = useTaskStore();
  const { user } = useAuthStore();
  const { openModal } = useUIStore();

  const activeTasks = tasks.filter((t) => !t.completed);

  const quadrantTasks: Record<EisenhowerQuadrant, Task[]> = {
    do_first: activeTasks.filter((t) => t.quadrant === 'do_first'),
    schedule: activeTasks.filter((t) => t.quadrant === 'schedule'),
    delegate: activeTasks.filter((t) => t.quadrant === 'delegate'),
    eliminate: activeTasks.filter((t) => t.quadrant === 'eliminate'),
  };

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
        // silent
      }
    }
  };

  const quadrantOrder: EisenhowerQuadrant[] = ['do_first', 'schedule', 'delegate', 'eliminate'];

  const totalActive = activeTasks.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Eisenhower Matrix
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Prioritize your {totalActive} active task{totalActive !== 1 ? 's' : ''} by urgency and importance
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quadrantOrder.map((qId) => {
          const config = QUADRANT_CONFIG[qId];
          const qTasks = quadrantTasks[qId];

          return (
            <div
              key={qId}
              className={cn(
                'rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                config.borderClass,
                'bg-white dark:bg-surface-dark'
              )}
            >
              {/* Quadrant Header */}
              <div
                className={cn(
                  'px-4 py-3 flex items-center justify-between',
                  config.bgClass
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm">{config.title}</h3>
                    <p className="text-[10px] opacity-70">{config.subtitle}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 dark:bg-black/20">
                  {qTasks.length}
                </span>
              </div>

              {/* Quadrant Tasks */}
              <div className="p-3 space-y-2 min-h-[120px] max-h-[400px] overflow-y-auto">
                {qTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-[100px] text-xs text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                      <p className="text-2xl mb-1 opacity-30">{config.icon}</p>
                      <p>No tasks here</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {qTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        compact
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-surface-dark-hover border border-gray-100 dark:border-gray-800">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          How it works
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quadrantOrder.map((qId) => {
            const config = QUADRANT_CONFIG[qId];
            const hints: Record<EisenhowerQuadrant, string> = {
              do_first: 'Crisis tasks, deadlines, urgent bugs — handle immediately',
              schedule: 'Goals, planning, learning — block time for these',
              delegate: 'Interruptions, some emails — pass to others if possible',
              eliminate: 'Time wasters, distractions — consider removing',
            };
            return (
              <div key={qId} className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{config.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {config.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {hints[qId]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
