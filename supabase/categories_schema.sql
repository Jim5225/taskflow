-- Create Pomodoro Categories Table
CREATE TABLE IF NOT EXISTS public.pomodoro_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366F1',
    target_sessions INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter pomodoro_sessions to support category_id
ALTER TABLE public.pomodoro_sessions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.pomodoro_categories(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pomo_categories_user_id ON public.pomodoro_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_pomo_sessions_category_id ON public.pomodoro_sessions(category_id);

-- Updated_at Trigger
CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON public.pomodoro_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.pomodoro_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.pomodoro_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.pomodoro_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.pomodoro_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.pomodoro_categories FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_categories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
