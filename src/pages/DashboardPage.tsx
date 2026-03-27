import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import TaskList from '../components/tasks/TaskList';
import AddTaskModal from '../components/tasks/AddTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import PomodoroTimer from '../components/pomodoro/PomodoroTimer';
import StatisticsView from '../components/statistics/StatisticsView';
import EisenhowerMatrix from '../components/eisenhower/EisenhowerMatrix';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import * as taskService from '../services/tasks';
import * as statsService from '../services/stats';
import type { UserStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { fetchTasks, upsertTask, deleteTaskLocal } = useTaskStore();
  const { activeView } = useUIStore();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Fetch tasks and stats on mount
  useEffect(() => {
    if (user) {
      fetchTasks(user.id);
      loadUserStats();
    }
  }, [user]);

  // Reload stats whenever user switches to statistics view
  useEffect(() => {
    if (user && (activeView === 'statistics' || activeView === 'tasks')) {
      loadUserStats();
    }
  }, [activeView, user]);

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const stats = await statsService.getUserStats(user.id);
      setUserStats(stats);
    } catch {
      // Stats may not exist yet
    }
  };

  // Setup realtime subscription for tasks
  useEffect(() => {
    if (!user) return;

    const channel = taskService.subscribeToTasks(user.id, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        upsertTask(payload.new);
        // If task was just completed via another device, refresh stats
        if (payload.eventType === 'UPDATE' && payload.new.completed && !payload.old?.completed) {
          loadUserStats();
        }
      } else if (payload.eventType === 'DELETE') {
        deleteTaskLocal(payload.old.id);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return (
    <AppLayout userXP={userStats?.xp || 0}>
      {activeView === 'tasks' && <TaskList />}
      {activeView === 'eisenhower' && <EisenhowerMatrix />}
      {activeView === 'pomodoro' && <PomodoroTimer />}
      {activeView === 'statistics' && <StatisticsView />}

      <AddTaskModal />
      <EditTaskModal />
    </AppLayout>
  );
}
