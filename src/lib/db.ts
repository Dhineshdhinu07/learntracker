import { getSupabase, LogEntry, WeeklyGoal, Category } from './supabase'
import { format, startOfWeek } from 'date-fns'

const USER_ID = 'default'

export async function getLogEntries(limit = 100): Promise<LogEntry[]> {
  const { data, error } = await getSupabase()
    .from('log_entries')
    .select('*')
    .eq('user_id', USER_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getTodayEntries(): Promise<LogEntry[]> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data, error } = await getSupabase()
    .from('log_entries')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addLogEntry(entry: Omit<LogEntry, 'id' | 'user_id' | 'created_at'>): Promise<LogEntry> {
  const { data, error } = await getSupabase()
    .from('log_entries')
    .insert({ ...entry, user_id: USER_ID })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLogEntry(id: string): Promise<void> {
  const { error } = await getSupabase().from('log_entries').delete().eq('id', id)
  if (error) throw error
}

export async function getWeeklyGoals(): Promise<WeeklyGoal[]> {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data, error } = await getSupabase()
    .from('weekly_goals')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('week_start', weekStart)
  if (error) throw error
  return data ?? []
}

export async function upsertWeeklyGoal(category: Category, targetMinutes: number): Promise<void> {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { error } = await getSupabase().from('weekly_goals').upsert({
    user_id: USER_ID,
    category,
    target_minutes: targetMinutes,
    week_start: weekStart,
  }, { onConflict: 'user_id,category,week_start' })
  if (error) throw error
}

export async function getEntriesForDateRange(from: string, to: string): Promise<LogEntry[]> {
  const { data, error } = await getSupabase()
    .from('log_entries')
    .select('*')
    .eq('user_id', USER_ID)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}
