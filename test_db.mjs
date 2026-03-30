import { createClient } from '@supabase/supabase-js';

const url = 'https://pftepxkdwiifdtdcafam.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdGVweGtkd2lpZmR0ZGNhZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODA2MDEsImV4cCI6MjA5MDA1NjYwMX0.Rue07DmrVcZdIifueNQA0DwU1ZQuJKUXoqfPXjBgNJU';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('pomodoro_categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error("DB Query Error:", error);
  } else {
    console.log("DB Query Success:", data);
  }
}

check();
