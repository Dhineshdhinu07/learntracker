'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getLogEntries, getChatHistory, saveChatMessage, clearChatHistory } from '@/lib/db'
import { LogEntry, CATEGORIES } from '@/lib/supabase'
import { Sparkles, Send, AlertTriangle, Loader2, FileText, Target, RefreshCw, Trash2 } from 'lucide-react'
import MarkdownMessage from '@/components/MarkdownMessage'
import { format, startOfWeek, endOfWeek, isToday, isYesterday, parseISO } from 'date-fns'

type Tab = 'chat' | 'report' | 'readiness'

interface Message {
  id?:         string        // DB row id — undefined for optimistic entries mid-flight
  role:        'user' | 'assistant'
  text:        string
  created_at?: string        // ISO timestamp from DB; undefined while saving
}

interface ReadinessData {
  overall:   number
  breakdown: { category: string; score: number; gap: string }[]
  verdict:   string
  topPriority: string
}

const QUICK_PROMPTS = [
  { icon: '🧭', text: 'What should I study today?' },
  { icon: '⚠️', text: 'What topics have I been neglecting?' },
  { icon: '📅', text: 'Build me a 2-week study plan' },
  { icon: '🔎', text: "How's my prep looking? Be honest." },
  { icon: '💡', text: "What's the highest ROI topic this week?" },
  { icon: '⏱️', text: 'I have 2 hours tonight — what should I do?' },
]

// ── Context builders ──────────────────────────────────────────────────────────
function buildContext(entries: LogEntry[], days = 30): string {
  if (!entries.length) return 'No study sessions logged yet.'
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
  const recent = entries.filter(e => new Date(e.date) >= cutoff)
  const byDate = recent.reduce<Record<string, LogEntry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []; acc[e.date].push(e); return acc
  }, {})
  const lines: string[] = []
  Object.keys(byDate).sort((a, b) => b.localeCompare(a)).forEach(date => {
    const es   = byDate[date]
    const mins = es.reduce((s, e) => s + e.duration_minutes, 0)
    lines.push(`\n${date} (${(mins / 60).toFixed(1)}h):`)
    es.forEach(e => lines.push(`  - [${e.category}] ${e.topic} (${e.duration_minutes}min)${e.notes ? ` — ${e.notes}` : ''}`))
  })
  const summary = CATEGORIES.map(c => {
    const m = entries.filter(e => e.category === c.value).reduce((s, e) => s + e.duration_minutes, 0)
    return `${c.value}: ${(m / 60).toFixed(1)}h`
  }).join(', ')
  return `Totals — ${summary}\n\nLog:${lines.join('\n')}`
}

function buildWeekContext(entries: LogEntry[]): string {
  const ws   = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const we   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const week = entries.filter(e => e.date >= ws && e.date <= we)
  if (!week.length) return 'No study sessions logged this week yet.'
  const total = week.reduce((s, e) => s + e.duration_minutes, 0)
  const lines = week.map(e => `- [${e.category}] ${e.topic} (${e.duration_minutes}min)${e.notes ? ` — ${e.notes}` : ''}`)
  return `Week total: ${(total / 60).toFixed(1)}h\n${lines.join('\n')}`
}

// ── Timestamp formatter ───────────────────────────────────────────────────────
function msgTime(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const d = parseISO(iso)
    if (isToday(d))     return format(d, 'h:mm a')
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, h:mm a')
  } catch { return '' }
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 70) return '#22c55e'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
}
function scoreLabel(s: number) {
  if (s >= 70) return 'Strong'
  if (s >= 50) return 'Moderate'
  if (s >= 30) return 'Early'
  return 'Not started'
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CoachPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [tab,     setTab]     = useState<Tab>('chat')

  // ── Chat state ──────────────────────────────────────────────────────────
  const [messages,     setMessages]     = useState<Message[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [input,        setInput]        = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const [noKey,        setNoKey]        = useState(false)
  const [clearing,     setClearing]     = useState(false)
  const [dbMissing,    setDbMissing]    = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Report state ────────────────────────────────────────────────────────
  const [report,        setReport]        = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  // ── Readiness state ─────────────────────────────────────────────────────
  const [readiness,        setReadiness]        = useState<ReadinessData | null>(null)
  const [readinessLoading, setReadinessLoading] = useState(false)

  // ── Load study entries + chat history on mount ───────────────────────────
  useEffect(() => {
    getLogEntries(200).then(setEntries).catch(() => {})
  }, [])

  useEffect(() => {
    setHistoryLoading(true)
    getChatHistory(100)
      .then(rows => setMessages(rows.map(r => ({ id: r.id, role: r.role, text: r.text, created_at: r.created_at }))))
      .catch(() => setDbMissing(true))
      .finally(() => setHistoryLoading(false))
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  // ── Send message ─────────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim() || chatLoading) return

    const userMsg: Message = { role: 'user', text: text.trim() }
    // Optimistic: show immediately
    setMessages(prev => [...prev, userMsg])
    setInput(''); setChatLoading(true); setNoKey(false)

    try {
      // Build history to send — include the new user message at the end
      const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }))

      const res  = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, context: buildContext(entries) }),
      })
      const data = await res.json()

      if (data.error === 'NO_KEY') {
        setNoKey(true)
        setMessages(prev => prev.slice(0, -1))   // remove optimistic user msg
        return
      }

      const assistantMsg: Message = { role: 'assistant', text: data.response }
      setMessages(prev => [...prev, assistantMsg])

      // Persist both to DB (fire-and-forget — don't block the UI)
      if (!dbMissing) {
        saveChatMessage('user', userMsg.text)
          .then(saved => setMessages(prev =>
            prev.map(m => m === userMsg ? { ...m, id: saved.id, created_at: saved.created_at } : m)
          ))
          .catch(() => {})

        saveChatMessage('assistant', assistantMsg.text)
          .then(saved => setMessages(prev =>
            prev.map(m => m === assistantMsg ? { ...m, id: saved.id, created_at: saved.created_at } : m)
          ))
          .catch(() => {})
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Try again.' }])
    } finally {
      setChatLoading(false)
    }
  }, [chatLoading, entries, messages, dbMissing])

  // ── Clear history ────────────────────────────────────────────────────────
  const handleClear = useCallback(async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return
    setClearing(true)
    try {
      await clearChatHistory()
      setMessages([])
    } catch { /* silent */ }
    finally { setClearing(false) }
  }, [])

  // ── Weekly report ────────────────────────────────────────────────────────
  const generateReport = useCallback(async () => {
    setReportLoading(true); setReport('')
    const weekLabel = `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}`
    try {
      const res  = await fetch('/api/weekly-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: buildWeekContext(entries), weekLabel }),
      })
      const data = await res.json()
      if (data.error === 'NO_KEY') setNoKey(true)
      else setReport(data.report ?? '')
    } catch { setReport('Failed to generate. Try again.') }
    finally { setReportLoading(false) }
  }, [entries])

  // ── Readiness ────────────────────────────────────────────────────────────
  const evaluateReadiness = useCallback(async () => {
    setReadinessLoading(true); setReadiness(null)
    try {
      const res  = await fetch('/api/readiness', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: buildContext(entries, 60) }),
      })
      const data = await res.json()
      if (data.error === 'NO_KEY') setNoKey(true)
      else if (data.overall !== undefined) setReadiness(data as ReadinessData)
    } catch { /* silent */ }
    finally { setReadinessLoading(false) }
  }, [entries])

  const weekLabel = `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}`

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="title-page" style={{ marginBottom: 4 }}>AI Coach</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Claude · full study log context · {messages.length} messages saved
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'var(--surface-2)', borderRadius: 10, width: 'fit-content' }}>
        {([
          { id: 'chat',      label: '💬 Chat'          },
          { id: 'report',    label: '📅 Weekly Report' },
          { id: 'readiness', label: '🎯 Readiness'      },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--surface-4)' : 'transparent',
            color:      tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            transition: 'all 120ms', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── No-key warning ── */}
      {noKey && (
        <div className="card animate-in" style={{ padding: '14px 16px', borderColor: 'rgba(245,158,11,0.4)', display: 'flex', gap: 10 }}>
          <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', margin: 0 }}>API key not set</p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
              Add <code style={{ fontSize: 11, background: 'var(--surface-3)', padding: '1px 4px', borderRadius: 4 }}>ANTHROPIC_API_KEY</code> to{' '}
              <code style={{ fontSize: 11, background: 'var(--surface-3)', padding: '1px 4px', borderRadius: 4 }}>.env.local</code> and restart.
            </p>
          </div>
        </div>
      )}

      {/* ── DB missing banner ── */}
      {dbMissing && tab === 'chat' && (
        <div className="card animate-in" style={{ padding: '14px 16px', borderColor: 'rgba(245,158,11,0.35)', display: 'flex', gap: 10 }}>
          <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', margin: 0 }}>Chat history table not found</p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
              Messages will still work but won&apos;t be saved. Run this in Supabase SQL editor:
            </p>
            <pre style={{ fontSize: 11, background: 'var(--surface-3)', borderRadius: 6, padding: '8px 10px', margin: '8px 0 0', color: 'var(--ink-3)', overflow: 'auto', lineHeight: 1.5 }}>
{`create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  role text not null,
  text text not null,
  created_at timestamptz default now()
);`}
            </pre>
          </div>
        </div>
      )}

      {/* ══════════════════ CHAT TAB ══════════════════ */}
      {tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Welcome card — shown only when no history */}
          {!historyLoading && messages.length === 0 && (
            <div className="card animate-in" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Your AI Study Coach</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '8px 0 16px', lineHeight: 1.5 }}>
                I have full context of your study log. Ask me anything about gaps, next topics, or your overall prep.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.text} onClick={() => send(p.text)} style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                    color: 'var(--ink-2)', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4,
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  >
                    <span>{p.icon}</span><span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History loading skeleton */}
          {historyLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--ink-4)', fontSize: 12 }}>
              <Loader2 size={12} className="animate-spin" /> Loading chat history…
            </div>
          )}

          {/* Clear history button — only when there are messages */}
          {!historyLoading && messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleClear} disabled={clearing} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                borderRadius: 7, background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--ink-4)', fontSize: 11, cursor: 'pointer', transition: 'all 120ms',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--red)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-4)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
              >
                <Trash2 size={11} /> {clearing ? 'Clearing…' : 'Clear history'}
              </button>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => {
            // Show date separator when the day changes
            const prevDate = i > 0 ? msgTime(messages[i - 1].created_at)?.split(',')[0] : null
            const thisDate = m.created_at ? format(parseISO(m.created_at), 'MMM d, yyyy') : null
            const showSep  = thisDate && prevDate && prevDate !== thisDate

            return (
              <div key={m.id ?? i}>
                {showSep && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                    <span style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{thisDate}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  </div>
                )}

                <div className="animate-in" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'user' ? (
                    <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: '14px 14px 4px 14px',
                        background: '#6366f1', color: '#fff', fontSize: 13, lineHeight: 1.5,
                      }}>
                        {m.text}
                      </div>
                      {m.created_at && (
                        <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{msgTime(m.created_at)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '14px 16px', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Sparkles size={12} style={{ color: '#818cf8' }} />
                        <span className="eyebrow" style={{ color: '#818cf8' }}>Coach</span>
                        {m.created_at && (
                          <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 'auto' }}>
                            {msgTime(m.created_at)}
                          </span>
                        )}
                      </div>
                      <MarkdownMessage text={m.text} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Thinking indicator */}
          {chatLoading && (
            <div className="card animate-in" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Thinking…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ══════════════════ WEEKLY REPORT TAB ══════════════════ */}
      {tab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Current week</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>{weekLabel}</p>
            </div>
            <button onClick={generateReport} disabled={reportLoading} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 9999 }}>
              {reportLoading
                ? <><Loader2 size={13} className="animate-spin" style={{ marginRight: 6 }} />Generating…</>
                : report
                  ? <><RefreshCw size={13} style={{ marginRight: 6 }} />Regenerate</>
                  : <><FileText size={13} style={{ marginRight: 6 }} />Generate Report</>}
            </button>
          </div>

          {reportLoading && (
            <div className="card animate-in" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Analysing your week…</span>
            </div>
          )}

          {!reportLoading && report && (
            <div className="card animate-in" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                <Sparkles size={12} style={{ color: '#818cf8' }} />
                <span className="eyebrow" style={{ color: '#818cf8' }}>Weekly analysis</span>
              </div>
              <MarkdownMessage text={report} />
            </div>
          )}

          {!reportLoading && !report && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <p style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
                Hit &quot;Generate Report&quot; for a full analysis — what you covered this week, gaps, and a plan for next week.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ READINESS TAB ══════════════════ */}
      {tab === 'readiness' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Interview readiness</div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Based on your last 60 days of study</p>
            </div>
            <button onClick={evaluateReadiness} disabled={readinessLoading} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 9999 }}>
              {readinessLoading
                ? <><Loader2 size={13} className="animate-spin" style={{ marginRight: 6 }} />Evaluating…</>
                : readiness
                  ? <><RefreshCw size={13} style={{ marginRight: 6 }} />Re-evaluate</>
                  : <><Target size={13} style={{ marginRight: 6 }} />Evaluate Readiness</>}
            </button>
          </div>

          {readinessLoading && (
            <div className="card animate-in" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Evaluating your prep against interview criteria…</span>
            </div>
          )}

          {!readinessLoading && readiness && (
            <>
              <div className="card hero-mesh animate-in" style={{ padding: '28px 20px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Overall readiness</div>
                  <div style={{ fontSize: 72, fontWeight: 300, letterSpacing: '-0.04em', color: scoreColor(readiness.overall), lineHeight: 1, marginBottom: 10, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"ss01","tnum"' }}>
                    {readiness.overall}<span style={{ fontSize: 36 }}>%</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px', lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                    {readiness.verdict}
                  </p>
                  {readiness.topPriority && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                      ⚡ Focus now: {readiness.topPriority}
                    </div>
                  )}
                </div>
              </div>

              <div className="card animate-in" style={{ padding: '16px 20px' }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {readiness.breakdown.map(item => (
                    <div key={item.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.category}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: scoreColor(item.score), fontWeight: 600 }}>{scoreLabel(item.score)}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(item.score), fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>{item.score}%</span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${item.score}%`, background: scoreColor(item.score), transition: 'width 600ms ease' }} />
                      </div>
                      {item.gap && (
                        <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: '4px 0 0' }}>↳ {item.gap}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!readinessLoading && !readiness && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
              <p style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
                Claude will score your prep against real interview requirements and show you exactly where the gaps are.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky chat input ── */}
      {tab === 'chat' && (
        <div style={{ position: 'sticky', bottom: 'calc(60px + env(safe-area-inset-bottom) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 8px 8px 14px', borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--line-strong)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your coach anything…"
              rows={1}
              style={{ flex: 1, width: 'auto', background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', resize: 'none', minHeight: 36, maxHeight: 120, padding: '6px 0', fontSize: 14, color: 'var(--ink)' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            />
            <button onClick={() => send(input)} disabled={chatLoading || !input.trim()} className="btn-primary" style={{ padding: '8px 14px', borderRadius: 10, flexShrink: 0 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
