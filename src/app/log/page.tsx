'use client'

import { useEffect, useState, useCallback } from 'react'
import { getLogEntries } from '@/lib/db'
import { LogEntry, CATEGORIES, Category } from '@/lib/supabase'
import SessionCard from '@/components/SessionCard'
import { format, parseISO } from 'date-fns'
import { Search } from 'lucide-react'

export default function LogPage() {
  const [entries, setEntries]     = useState<LogEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState<Category | 'All'>('All')

  const load = useCallback(async () => {
    setLoading(true)
    try { setEntries(await getLogEntries(300)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = entries.filter(e => {
    const matchCat    = filterCat === 'All' || e.category === filterCat
    const matchSearch = !search ||
      e.topic.toLowerCase().includes(search.toLowerCase()) ||
      e.notes?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = filtered.reduce<Record<string, LogEntry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const totalMins = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const totalHrs  = (totalMins / 60).toFixed(1)

  const TINT_MAP: Record<string, { bg: string; text: string; border: string }> = {
    'DSA':                  { bg:'rgba(99,102,241,0.10)',  text:'#818cf8', border:'rgba(99,102,241,0.25)'  },
    'Python':               { bg:'rgba(14,165,233,0.10)',  text:'#38bdf8', border:'rgba(14,165,233,0.25)'  },
    'System Design':        { bg:'rgba(16,185,129,0.10)',  text:'#34d399', border:'rgba(16,185,129,0.25)'  },
    'Computer Fundamentals':{ bg:'rgba(245,158,11,0.10)',  text:'#fbbf24', border:'rgba(245,158,11,0.25)'  },
    'Frontend':             { bg:'rgba(236,72,153,0.10)',  text:'#f472b6', border:'rgba(236,72,153,0.25)'  },
    'Backend':              { bg:'rgba(139,92,246,0.10)',  text:'#c084fc', border:'rgba(139,92,246,0.25)'  },
    'Other':                { bg:'rgba(107,114,128,0.10)', text:'#9ca3af', border:'rgba(107,114,128,0.20)' },
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="title-page" style={{ marginBottom: 4 }}>Study Log</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          <span className="num">{entries.length}</span> sessions ·{' '}
          <span className="num">{totalHrs}h</span> total
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {/* Search — Notion search-pill style */}
        <div style={{ position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)', pointerEvents:'none' }} />
          <input
            type="text"
            placeholder="Search topics or notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, background:'var(--surface-2)' }}
          />
        </div>

        {/* Category filter pills (Notion pill-tab style) */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(['All', ...CATEGORIES.map(c => c.value)] as (Category | 'All')[]).map(cat => {
            const c      = CATEGORIES.find(x => x.value === cat)
            const active = filterCat === cat
            const t      = cat === 'All' ? null : TINT_MAP[cat]
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className="chip"
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? (t?.bg ?? 'var(--accent-bg)') : 'var(--surface-2)',
                  color: active ? (t?.text ?? '#818cf8') : 'var(--ink-3)',
                  borderColor: active ? (t?.border ?? 'rgba(99,102,241,0.25)') : 'var(--line)',
                  transition: 'all 120ms',
                }}
              >
                {c?.icon ?? ''} {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Log ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-4)', fontSize:13 }}>Loading…</div>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-4)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🗒️</div>
          <p style={{ fontSize:13 }}>No sessions found.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {sortedDates.map(date => {
            const dayEntries = grouped[date]
            const dayMins    = dayEntries.reduce((s, e) => s + e.duration_minutes, 0)
            const dh = Math.floor(dayMins / 60), dm = dayMins % 60
            const dStr = dh > 0 ? `${dh}h${dm > 0 ? ` ${dm}m` : ''}` : `${dm}m`
            const label = format(parseISO(date), 'EEEE, MMM d').toUpperCase()
            return (
              <div key={date}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span className="eyebrow">{label}</span>
                  <span style={{ fontSize:12, color:'var(--ink-3)', fontVariantNumeric:'tabular-nums' }}>{dStr}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {dayEntries.map(e => (
                    <SessionCard key={e.id} entry={e} onDeleted={load} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
