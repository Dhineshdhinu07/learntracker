'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTodayEntries } from '@/lib/db'
import { LogEntry, CATEGORIES } from '@/lib/supabase'
import LogEntryForm from '@/components/LogEntryForm'
import SessionCard from '@/components/SessionCard'
import { format } from 'date-fns'
import { Flame, Clock, Layers, AlertTriangle } from 'lucide-react'

export default function TodayPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)

  const load = useCallback(async () => {
    try {
      setEntries(await getTodayEntries())
      setDbError(false)
    } catch { setDbError(true) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalMins = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const h = Math.floor(totalMins / 60), m = totalMins % 60
  const totalStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : totalMins > 0 ? `${m}m` : '—'

  const topCat = CATEGORIES
    .map(c => ({ ...c, mins: entries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0) }))
    .filter(c => c.mins > 0)
    .sort((a, b) => b.mins - a.mins)[0]

  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

      {/* ── Stripe-mesh hero ────────────────────────────────── */}
      <div
        className="hero-mesh"
        style={{
          padding: '28px 24px 24px',
          borderRadius: 14,
          background: 'var(--surface-1)',
          border: '1px solid var(--line)',
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{today}</div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'var(--ink)',
              margin: '0 0 18px',
              lineHeight: 1.15,
            }}
          >
            Today&apos;s{' '}
            <span className="gradient-text">progress</span>
          </h1>

          {/* Stat row — Stripe tabular nums */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { icon: <Clock size={14} />, value: totalStr, label: 'Studied', accent: '#818cf8' },
              { icon: <Layers size={14} />, value: String(entries.length), label: 'Sessions', accent: '#34d399' },
              { icon: <Flame size={14} />, value: topCat?.icon ?? '—', label: topCat?.value ?? 'No sessions', accent: '#fbbf24' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ color: s.accent, marginBottom: 6 }}>{s.icon}</div>
                <div className="stat-num" style={{ fontSize: 22, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category breakdown ──────────────────────────────── */}
      {entries.length > 0 && (() => {
        const cats = CATEGORIES
          .map(c => ({ ...c, mins: entries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0) }))
          .filter(c => c.mins > 0)
        return (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Today&apos;s breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cats.map(c => {
                const pct  = Math.round((c.mins / totalMins) * 100)
                const ch   = Math.floor(c.mins / 60), cm = c.mins % 60
                const cStr = ch > 0 ? `${ch}h${cm > 0 ? ` ${cm}m` : ''}` : `${cm}m`
                return (
                  <div key={c.value}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{c.icon} {c.value}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                        {cStr} · {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── DB error ────────────────────────────────────────── */}
      {dbError && (
        <div
          className="card animate-in"
          style={{ padding: '14px 16px', marginBottom: 20, borderColor: 'rgba(239,68,68,0.4)', display:'flex', gap:10 }}
        >
          <AlertTriangle size={15} style={{ color:'#ef4444', flexShrink:0, marginTop:1 }} />
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#ef4444', margin:0 }}>Supabase not connected</p>
            <p style={{ fontSize:12, color:'var(--ink-3)', margin:'4px 0 0' }}>
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, run the SQL schema, then restart.
            </p>
          </div>
        </div>
      )}

      {/* ── Log form ─────────────────────────────────────────── */}
      <LogEntryForm onAdded={load} />

      {/* ── Today's sessions ─────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Today&apos;s sessions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {entries.map(e => (
              <SessionCard key={e.id} entry={e} onDeleted={load} />
            ))}
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && !dbError && (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📖</div>
          <p style={{ fontSize:13 }}>No sessions yet today. Log your first one above!</p>
        </div>
      )}
    </div>
  )
}
