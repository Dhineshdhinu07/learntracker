import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || url === 'your_supabase_url_here' || !key || key === 'your_supabase_anon_key_here') {
      throw new Error('SUPABASE_NOT_CONFIGURED')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

export type Category = 'DSA' | 'Python' | 'System Design' | 'Computer Fundamentals' | 'Frontend' | 'Backend' | 'Other'

export const CATEGORIES: { value: Category; color: string; icon: string }[] = [
  { value: 'DSA',                  color: '#6366f1', icon: '🧩' },
  { value: 'Python',               color: '#0ea5e9', icon: '🐍' },
  { value: 'System Design',        color: '#10b981', icon: '🏗️' },
  { value: 'Computer Fundamentals',color: '#f59e0b', icon: '💻' },
  { value: 'Frontend',             color: '#ec4899', icon: '🎨' },
  { value: 'Backend',              color: '#8b5cf6', icon: '⚙️' },
  { value: 'Other',                color: '#6b7280', icon: '📚' },
]

export interface LogEntry {
  id: string
  user_id: string
  category: Category
  topic: string
  start_time: string
  end_time: string
  duration_minutes: number
  notes: string | null
  date: string
  created_at: string
}

export interface WeeklyGoal {
  id: string
  user_id: string
  category: Category
  target_minutes: number
  week_start: string
}

export type Difficulty    = 'Easy' | 'Medium' | 'Hard'
export type ProblemStatus = 'Todo' | 'Attempted' | 'Solved' | 'Revisit'

export interface ProblemLog {
  id:         string
  user_id:    string
  title:      string
  url:        string | null
  difficulty: Difficulty
  status:     ProblemStatus
  category:   Category
  notes:      string | null
  date:       string
  created_at: string
}

export interface RevisionTopic {
  id:           string
  user_id:      string
  topic:        string
  category:     Category
  interval_days: number
  last_reviewed: string
  next_review:   string
  notes:        string | null
  created_at:   string
}

// SQL to create tables in Supabase:
// create table problem_log (
//   id uuid primary key default gen_random_uuid(),
//   user_id text not null default 'default',
//   title text not null,
//   url text,
//   difficulty text not null,
//   status text not null default 'Todo',
//   category text not null default 'DSA',
//   notes text,
//   date date not null default current_date,
//   created_at timestamptz default now()
// );
// create table revision_topics (
//   id uuid primary key default gen_random_uuid(),
//   user_id text not null default 'default',
//   topic text not null,
//   category text not null,
//   interval_days int not null default 7,
//   last_reviewed date not null default current_date,
//   next_review date not null,
//   notes text,
//   created_at timestamptz default now()
// );
