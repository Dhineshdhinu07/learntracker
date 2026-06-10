import { getSupabase, LogEntry, WeeklyGoal, Category, ProblemLog, RevisionTopic, Difficulty, ProblemStatus } from './supabase'
import { format, startOfWeek, addDays } from 'date-fns'

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

// ─── Problem Log ─────────────────────────────────────────────────────────────

export async function getProblemLog(): Promise<ProblemLog[]> {
  const { data, error } = await getSupabase()
    .from('problem_log')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addProblem(p: Omit<ProblemLog, 'id' | 'user_id' | 'created_at'>): Promise<ProblemLog> {
  const { data, error } = await getSupabase()
    .from('problem_log')
    .insert({ ...p, user_id: USER_ID })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProblemStatus(id: string, status: ProblemStatus): Promise<void> {
  const { error } = await getSupabase()
    .from('problem_log')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProblem(id: string): Promise<void> {
  const { error } = await getSupabase().from('problem_log').delete().eq('id', id)
  if (error) throw error
}

// ─── Revision Topics ─────────────────────────────────────────────────────────

export async function getRevisionTopics(): Promise<RevisionTopic[]> {
  const { data, error } = await getSupabase()
    .from('revision_topics')
    .select('*')
    .eq('user_id', USER_ID)
    .order('next_review', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addRevisionTopic(t: Omit<RevisionTopic, 'id' | 'user_id' | 'created_at'>): Promise<RevisionTopic> {
  const { data, error } = await getSupabase()
    .from('revision_topics')
    .insert({ ...t, user_id: USER_ID })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markRevisionReviewed(id: string, intervalDays: number): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const nextReview = format(addDays(new Date(), intervalDays), 'yyyy-MM-dd')
  const { error } = await getSupabase()
    .from('revision_topics')
    .update({ last_reviewed: today, next_review: nextReview })
    .eq('id', id)
  if (error) throw error
}

export async function deleteRevisionTopic(id: string): Promise<void> {
  const { error } = await getSupabase().from('revision_topics').delete().eq('id', id)
  if (error) throw error
}
