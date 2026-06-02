'use client'

import { useEffect, useState, useCallback } from 'react'
import { getWeeklyGoals, upsertWeeklyGoal, getEntriesForDateRange } from '@/lib/db'
import { WeeklyGoal, CATEGORIES, Category } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Edit2, Check, X } from 'lucide-react'

const DEFAULT_GOALS: Record<Category, number> = {
  'DSA': 300, 'Java': 180, 'System Design': 120, 'AI Engineering': 120, 'Other': 60,
}

const GUIDES: { cat: string; rec: string; why: string; color: string }[] = [
  { cat: '🧩 DSA',          rec: '5h/week', why: 'Core for FAANG & product interviews',  color: '#818cf8' },
  { cat: '☕ Java',          rec: '3h/week', why: 'Internals, concurrency, Spring',        color: '#fbbf24' },
  { cat: '🏗️ System Design', rec: '2h/week', why: 'HLD + LLD fundamentals',               color: '#34d399' },
  { cat: '🤖 AI Engineering',rec: '2h/week', why: 'LLMs, RAG, agents, Claude API',         color: '#c084fc' },
]

export default function PlanPage() {
  const [goals, setGoals]         = useState<WeeklyGoal[]>([])
  const [actual, setActual]       = useState<Record<string, number>>({})
  const [editing, setEditing]     = useState<Category | null>(null)
  const [editVal, setEditVal]     = useState('')
  const [loading, setLoading]     = useState(true)

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekLabel = `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}`

  const load = useCallback(async () => {
    const [g, entries] = await Promise.all([getWeeklyGoals(), getEntriesForDateRange(weekStart, weekEnd)])
    setGoals(g)
    setActual(entries.reduce<Record<string,number>>((acc,e) => { acc[e.category] = (acc[e.category] ?? 0) + e.duration_minutes; return acc }, {}))
    setLoading(false)
  }, [weekStart, weekEnd])

  useEffect(() => { load() }, [load])

  const getTarget = (cat: Category) => goals.find(g => g.category === cat)?.target_minutes ?? DEFAULT_GOALS[cat]
  const fmt = (m: number) => { const h = Math.floor(m/60), mn = m%60; return h > 0 ? `${h}h${mn > 0 ? ` ${mn}m` : ''}` : `${mn}m` }

  async function save(cat: Category) {
    const v = parseInt(editVal)
    if (isNaN(v) || v < 1) return
    await upsertWeeklyGoal(cat, v)
    await load()
    setEditing(null)
  }

  const totalTarget = CATEGORIES.reduce((s, c) => s + getTarget(c.value), 0)
  const totalActual = Object.values(actual).reduce((s, v) => s + v, 0)
  const totalPct    = Math.min(Math.round((totalActual / totalTarget) * 100), 100)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="title-page" style={{ marginBottom: 4 }}>Weekly Plan</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{weekLabel}</p>
      </div>

      {/* ── Overall progress — Stripe-pill style ── */}
      <div
        className="hero-mesh"
        style={{ padding:'20px', borderRadius:12, background:'var(--surface-1)', border:'1px solid var(--line)', marginBottom:16, overflow:'hidden', position:'relative' }}
      >
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.02em' }}>
              Overall — week {weekLabel}
            </span>
            <span className="stat-num" style={{ fontSize:24, color: totalPct >= 100 ? '#34d399' : 'var(--ink)' }}>
              {totalPct}%
            </span>
          </div>
          <div className="progress-track" style={{ height:6 }}>
            <div className="progress-fill" style={{
              width:`${totalPct}%`,
              background: totalPct >= 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #818cf8)',
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <span style={{ fontSize:12, color:'var(--ink-3)', fontVariantNumeric:'tabular-nums' }}>{fmt(totalActual)} studied</span>
            <span style={{ fontSize:12, color:'var(--ink-4)', fontVariantNumeric:'tabular-nums' }}>{fmt(totalTarget)} target</span>
          </div>
        </div>
      </div>

      {/* ── Per-category goals ── */}
      <div className="card" style={{ padding:'18px 20px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span className="eyebrow">Weekly targets</span>
          <span style={{ fontSize:11, color:'var(--ink-4)' }}>tap to edit</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {CATEGORIES.map(c => {
            const target  = getTarget(c.value)
            const got     = actual[c.value] ?? 0
            const pct     = Math.min(Math.round((got / target) * 100), 100)
            const done    = got >= target
            const isEdit  = editing === c.value

            return (
              <div key={c.value}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7, gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{c.icon} {c.value}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {isEdit ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input
                          type="number"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          style={{ width:72, padding:'4px 8px', fontSize:12 }}
                          autoFocus
                          onKeyDown={e => { if (e.key==='Enter') save(c.value); if (e.key==='Escape') setEditing(null) }}
                        />
                        <span style={{ fontSize:11, color:'var(--ink-3)' }}>min</span>
                        <button onClick={() => save(c.value)} style={{ background:'none', border:'none', cursor:'pointer', color:'#34d399', padding:2 }}><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', padding:2 }}><X size={14} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditing(c.value); setEditVal(String(target)) }}
                        style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color: done ? '#34d399' : 'var(--ink-3)', fontSize:12, fontVariantNumeric:'tabular-nums', padding:0 }}
                      >
                        {fmt(got)} / {fmt(target)}
                        <Edit2 size={10} />
                      </button>
                    )}
                    {done && <span style={{ fontSize:14 }}>✅</span>}
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${pct}%`, background: done ? '#22c55e' : c.color }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:11, color:'var(--ink-4)' }}>{pct}% complete</span>
                  {!done && <span style={{ fontSize:11, color:'var(--ink-4)', fontVariantNumeric:'tabular-nums' }}>{fmt(target - got)} to go</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Guide cards (Notion-style tinted) ── */}
      <div className="eyebrow" style={{ marginBottom:10 }}>Recommended weekly targets</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
        {GUIDES.map(g => (
          <div
            key={g.cat}
            style={{
              borderRadius:10,
              padding:'12px 14px',
              background:'var(--surface-1)',
              border:'1px solid var(--line)',
            }}
          >
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>{g.cat}</div>
            <div style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:9999, background:`${g.color}18`, border:`1px solid ${g.color}33`, fontSize:11, fontWeight:700, color:g.color, marginBottom:6 }}>
              {g.rec}
            </div>
            <div style={{ fontSize:12, color:'var(--ink-3)' }}>{g.why}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
