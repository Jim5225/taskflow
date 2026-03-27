import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModalType, PomodoroState } from '../types';
import {
  POMODORO_WORK_DURATION,
  POMODORO_SHORT_BREAK,
  POMODORO_LONG_BREAK,
} from '../utils/constants';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  activeModal: ModalType;
  activeView: 'tasks' | 'pomodoro' | 'statistics' | 'eisenhower';
  pomodoro: PomodoroState;

  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setActiveView: (view: 'tasks' | 'pomodoro' | 'statistics' | 'eisenhower') => void;

  // Pomodoro actions
  startPomodoro: (taskId?: string | null) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void;
  completePomodoro: () => void;
  skipToBreak: () => void;
  skipToWork: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      sidebarOpen: true,
      activeModal: null,
      activeView: 'tasks',
      pomodoro: {
        isRunning: false,
        type: 'work',
        timeLeft: POMODORO_WORK_DURATION,
        totalTime: POMODORO_WORK_DURATION,
        sessionsCompleted: 0,
        currentTaskId: null,
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
      setActiveView: (view) => set({ activeView: view }),

      startPomodoro: (taskId = null) =>
        set((s) => ({
          pomodoro: {
            ...s.pomodoro,
            isRunning: true,
            currentTaskId: taskId ?? s.pomodoro.currentTaskId,
          },
        })),

      pausePomodoro: () =>
        set((s) => ({
          pomodoro: { ...s.pomodoro, isRunning: false },
        })),

      resumePomodoro: () =>
        set((s) => ({
          pomodoro: { ...s.pomodoro, isRunning: true },
        })),

      resetPomodoro: () =>
        set({
          pomodoro: {
            isRunning: false,
            type: 'work',
            timeLeft: POMODORO_WORK_DURATION,
            totalTime: POMODORO_WORK_DURATION,
            sessionsCompleted: 0,
            currentTaskId: null,
          },
        }),

      tickPomodoro: () => {
        const { pomodoro } = get();
        if (pomodoro.timeLeft > 0) {
          set({
            pomodoro: { ...pomodoro, timeLeft: pomodoro.timeLeft - 1 },
          });
        }
      },

      completePomodoro: () => {
        const p = get().pomodoro;
        const newSessionsCompleted = p.type === 'work' ? p.sessionsCompleted + 1 : p.sessionsCompleted;
        const isLongBreak = newSessionsCompleted % 4 === 0 && p.type === 'work';

        let nextType: PomodoroState['type'];
        let nextTime: number;

        if (p.type === 'work') {
          nextType = isLongBreak ? 'long_break' : 'short_break';
          nextTime = isLongBreak ? POMODORO_LONG_BREAK : POMODORO_SHORT_BREAK;
        } else {
          nextType = 'work';
          nextTime = POMODORO_WORK_DURATION;
        }

        set({
          pomodoro: {
            isRunning: false,
            type: nextType,
            timeLeft: nextTime,
            totalTime: nextTime,
            sessionsCompleted: newSessionsCompleted,
            currentTaskId: p.currentTaskId,
          },
        });
      },

      skipToBreak: () =>
        set({
          pomodoro: {
            ...get().pomodoro,
            isRunning: false,
            type: 'short_break',
            timeLeft: POMODORO_SHORT_BREAK,
            totalTime: POMODORO_SHORT_BREAK,
          },
        }),

      skipToWork: () =>
        set({
          pomodoro: {
            ...get().pomodoro,
            isRunning: false,
            type: 'work',
            timeLeft: POMODORO_WORK_DURATION,
            totalTime: POMODORO_WORK_DURATION,
          },
        }),
    }),
    {
      name: 'tickflow-ui',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
