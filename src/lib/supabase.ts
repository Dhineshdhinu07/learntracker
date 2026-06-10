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
