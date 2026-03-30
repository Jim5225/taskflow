-- ============================================================
-- TickFlow ULTIMATE MASTER SCHEMA
-- 100% Crash-Proof. Safe to run 100 times. Never deletes data.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Helper Functions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 2. Core Tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_tasks_completed INTEGER DEFAULT 0,
    total_pomodoros_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_focus_minutes INTEGER DEFAULT 0,
    level TEXT DEFAULT 'rookie',
    xp INTEGER DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pomodoro_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366F1',
    target_sessions INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration INTEGER NOT NULL DEFAULT 25,
    type TEXT CHECK (type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'target', 
    color TEXT DEFAULT '#3B82F6', 
    target_days INTEGER DEFAULT 30, 
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
    reminder_time TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_at DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, completed_at)
);

-- ------------------------------------------------------------
-- 3. Dynamic Column Fixes (Adds columns if missing from older versions)
-- ------------------------------------------------------------
ALTER TABLE public.pomodoro_categories ADD COLUMN IF NOT EXISTS target_sessions INTEGER DEFAULT 1;
ALTER TABLE public.pomodoro_categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';
ALTER TABLE public.pomodoro_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.pomodoro_categories(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS quadrant TEXT CHECK (quadrant IN ('do_first', 'schedule', 'delegate', 'eliminate')) DEFAULT 'schedule';

-- ------------------------------------------------------------
-- 4. Initializing Quadrant Data
-- ------------------------------------------------------------
DO $$ 
BEGIN 
  UPDATE public.tasks SET quadrant = 'do_first' WHERE quadrant IS NULL AND priority = 'urgent';
  UPDATE public.tasks SET quadrant = 'do_first' WHERE quadrant IS NULL AND priority = 'high' AND due_date IS NOT NULL AND due_date < NOW() + INTERVAL '24 hours';
  UPDATE public.tasks SET quadrant = 'schedule' WHERE quadrant IS NULL AND priority IN ('high', 'medium');
  UPDATE public.tasks SET quadrant = 'eliminate' WHERE quadrant IS NULL AND priority = 'low';
  UPDATE public.tasks SET quadrant = 'schedule' WHERE quadrant IS NULL;
END $$;

-- ------------------------------------------------------------
-- 5. Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_pomo_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomo_categories_user_id ON public.pomodoro_categories(user_id);

-- ------------------------------------------------------------
-- 6. Enable Realtime Subscriptions
-- ------------------------------------------------------------
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_sessions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.habits; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_categories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 7. Triggers (Ignore if they already exist)
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.pomodoro_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 8. Enable Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_categories ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 9. Security Policies (Crash-Proof blocks)
-- ------------------------------------------------------------

-- PROFILES
DO $$ BEGIN CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TASKS
DO $$ BEGIN CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- POMODORO SESSIONS
DO $$ BEGIN CREATE POLICY "Users can view own pomodoros" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own pomodoros" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own pomodoros" ON public.pomodoro_sessions FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own pomodoros" ON public.pomodoro_sessions FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- POMODORO CATEGORIES
DO $$ BEGIN CREATE POLICY "Users can view own categories" ON public.pomodoro_categories FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own categories" ON public.pomodoro_categories FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own categories" ON public.pomodoro_categories FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own categories" ON public.pomodoro_categories FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USER STATS
DO $$ BEGIN CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- HABITS
DO $$ BEGIN CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- HABIT LOGS
DO $$ BEGIN CREATE POLICY "Users can view own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own habit logs" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 10. Refresh Cache
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
