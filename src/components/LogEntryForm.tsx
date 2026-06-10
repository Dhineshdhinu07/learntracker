'use client'

import { useState } from 'react'
import { CATEGORIES, Category } from '@/lib/supabase'
import { addLogEntry } from '@/lib/db'
import { format, parseISO, addDays } from 'date-fns'
import { Plus, Clock, Moon } from 'lucide-react'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

interface Props { onAdded: () => void }

function calcDuration(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const s = sh * 60 + sm, e = eh * 60 + em
  if (e > s)  return e - s
  if (e < s)  return (24 * 60 - s) + e
  return 0
}

function snapSlot(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = (Math.floor(date.getMinutes() / 15) * 15).toString().padStart(2, '0')
  return `${h}:${m}`
}

const TINT_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  'DSA':                  { bg:'rgba(99,102,241,0.08)',  text:'#818cf8', border:'rgba(99,102,241,0.25)',  activeBg:'rgba(99,102,241,0.16)'  },
  'Python':               { bg:'rgba(14,165,233,0.08)',  text:'#38bdf8', border:'rgba(14,165,233,0.25)',  activeBg:'rgba(14,165,233,0.16)'  },
  'System Design':        { bg:'rgba(16,185,129,0.08)',  text:'#34d399', border:'rgba(16,185,129,0.25)',  activeBg:'rgba(16,185,129,0.16)'  },
  'Computer Fundamentals':{ bg:'rgba(245,158,11,0.08)',  text:'#fbbf24', border:'rgba(245,158,11,0.25)',  activeBg:'rgba(245,158,11,0.16)'  },
  'Frontend':             { bg:'rgba(236,72,153,0.08)',  text:'#f472b6', border:'rgba(236,72,153,0.25)',  activeBg:'rgba(236,72,153,0.16)'  },
  'Backend':              { bg:'rgba(139,92,246,0.08)',  text:'#c084fc', border:'rgba(139,92,246,0.25)',  activeBg:'rgba(139,92,246,0.16)'  },
  'Other':                { bg:'rgba(107,114,128,0.08)', text:'#9ca3af', border:'rgba(107,114,128,0.20)', activeBg:'rgba(107,114,128,0.14)' },
}

export default function LogEntryForm({ onAdded }: Props) {
  const now = new Date()
  const [category, setCategory]   = useState<Category>('DSA')
  const [topic, setTopic]         = useState('')
  const [date, setDate]           = useState(format(now, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(snapSlot(new Date(now.getTime() - 3600000)))
  const [endTime, setEndTime]     = useState(snapSlot(now))
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const duration    = calcDuration(startTime, endTime)
  const crossNight  = duration > 0 && calcDuration(startTime, endTime) !== ((parseInt(endTime) - parseInt(startTime)))
  const isMidnight  = startTime > endTime && duration > 0
  const nextDay     = date ? format(addDays(parseISO(date), 1), 'EEE, MMM d') : ''

  const h   = Math.floor(duration / 60)
  const m   = duration % 60
  const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) { setError('Add a topic'); return }
    if (!date)         { setError('Pick a date');  return }
    if (duration <= 0) { setError('Start and end time cannot be the same'); return }
    setError(''); setLoading(true)
    try {
      await addLogEntry({ category, topic: topic.trim(), start_time: startTime, end_time: endTime, duration_minutes: duration, notes: notes.trim() || null, date })
      setTopic(''); setNotes('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      onAdded()
    } catch (err) {
      setError('Failed to save. Check Supabase config.')
      console.error(err)
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="card animate-in" style={{ padding: '20px 20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="title-card">Log a session</span>
        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Today ·  {format(now, 'MMM d')}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Category selector (Notion-style tinted pills) ── */}
        <div>
          <label>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(c => {
              const t = TINT_MAP[c.value]
              const active = category === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className="chip"
                  style={{
                    background: active ? t.activeBg : t.bg,
                    color: t.text,
                    borderColor: active ? t.border : 'transparent',
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 120ms',
                    outline: active ? `1px solid ${t.border}` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {c.icon} {c.value}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Topic ── */}
        <div>
          <label>What did you study?</label>
          <input
            type="text"
            placeholder="e.g. Binary Trees, HashMap internals, LLD Parking Lot…"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* ── Date ── */}
        <div>
          <label>Session date</label>
          <DatePicker value={date} onChange={setDate} maxDate={new Date()} />
        </div>

        {/* ── Time range ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label>Start</label>
            <TimePicker value={startTime} onChange={setStartTime} />
          </div>
          <div>
            <label>End</label>
            <TimePicker value={endTime} onChange={setEndTime} />
          </div>
        </div>

        {/* ── Duration pill (Stripe micro-cap style) ── */}
        {duration > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--accent-bg)',
                border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 12,
                fontWeight: 600,
                color: '#818cf8',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Clock size={11} />
              {dur} logged
            </div>
            {isMidnight && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(139,92,246,0.10)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  fontSize: 12,
                  color: '#c084fc',
                }}
              >
                <Moon size={11} />
                Crosses midnight → <strong>{nextDay}</strong>
              </div>
            )}
          </div>
        )}

        {/* ── Notes ── */}
        <div>
          <label>Notes <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
          <textarea
            placeholder="Key takeaways, topics to revisit, links…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>
        )}

        {/* ── Submit — Stripe pill ── */}
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          <Plus size={15} />
          {loading ? 'Saving…' : 'Log Session'}
        </button>
      </div>
    </form>
  )
}
