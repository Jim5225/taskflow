import { useEffect, useRef } from 'react';
import { useHabitStore } from '../stores/habitStore';
import { format } from 'date-fns';

export function useHabitReminders() {
  const { habits } = useHabitStore();
  const lastNotified = useRef<Record<string, string>>({}); // { habitId: lastNotifiedDateTime }

  useEffect(() => {
    if (!("Notification" in window)) return;

    const checkReminders = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const currentDate = format(now, "yyyy-MM-dd");

      habits.forEach((habit) => {
        if (habit.reminder_time === currentTime) {
          const key = `${habit.id}_${currentDate}_${currentTime}`;
          
          if (!lastNotified.current[key]) {
            new Notification("TickFlow Habit Reminder", {
              body: `Time for your habit: ${habit.title}! ✨`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176313.png',
              tag: habit.id,
            });
            
            lastNotified.current[key] = "notified";
            
            // Keep memory lean
            if (Object.keys(lastNotified.current).length > 20) {
              lastNotified.current = { [key]: "notified" };
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [habits]);
}
