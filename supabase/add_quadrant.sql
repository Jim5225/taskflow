-- ============================================================
-- TickFlow — Add Eisenhower Matrix quadrant column
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add quadrant column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS quadrant TEXT
CHECK (quadrant IN ('do_first', 'schedule', 'delegate', 'eliminate'))
DEFAULT 'schedule';

-- Backfill existing tasks based on priority
UPDATE public.tasks SET quadrant = 'do_first' WHERE quadrant IS NULL AND priority = 'urgent';
UPDATE public.tasks SET quadrant = 'do_first' WHERE quadrant IS NULL AND priority = 'high' AND due_date IS NOT NULL AND due_date < NOW() + INTERVAL '24 hours';
UPDATE public.tasks SET quadrant = 'schedule' WHERE quadrant IS NULL AND priority IN ('high', 'medium');
UPDATE public.tasks SET quadrant = 'eliminate' WHERE quadrant IS NULL AND priority = 'low';
UPDATE public.tasks SET quadrant = 'schedule' WHERE quadrant IS NULL;
