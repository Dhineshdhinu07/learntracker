'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEntriesForDateRange } from '@/lib/db'
import { LogEntry, CATEGORIES } from '@/lib/supabase'
import {
  format, subDays, addDays, eachDayOfInterval,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subMonths, parseISO, getDaysInMonth,
} from 'date-fns'
import { Flame, Clock, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react'

type Tab = 'overview' | 'monthly'

const fmt = (m: number) => { const h = Math.floor(m/60), mn = m%60; return h > 0 ? `${h}h${mn > 0 ? ` ${mn}m` : ''}` : `${mn}m` }

export default function StatsPage() {
  const [tab,     setTab]     = useState<Tab>('overview')
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Monthly tab state
  const [monthDate,     setMonthDate]     = useState(new Date())
  const [monthEntries,  setMonthEntries]  = useState<LogEntry[]>([])
  const [prevEntries,   setPrevEntries]   = useState<LogEntry[]>([])
  const [monthLoading,  setMonthLoading]  = useState(false)

  // ── Overview data load (60 days) ─────────────────────────────────────────
  const load = useCallback(async () => {
    const from = format(subDays(new Date(), 60), 'yyyy-MM-dd')
    const to   = format(new Date(), 'yyyy-MM-dd')
    setEntries(await getEntriesForDateRange(from, to))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Monthly data load ────────────────────────────────────────────────────
  const loadMonth = useCallback(async (d: Date) => {
    setMonthLoading(true)
    const mStart = format(startOfMonth(d), 'yyyy-MM-dd')
    const mEnd   = format(endOfMonth(d),   'yyyy-MM-dd')
    const prev   = subMonths(d, 1)
    const pStart = format(startOfMonth(prev), 'yyyy-MM-dd')
    const pEnd   = format(endOfMonth(prev),   'yyyy-MM-dd')
    try {
      const [cur, pre] = await Promise.all([
        getEntriesForDateRange(mStart, mEnd),
        getEntriesForDateRange(pStart, pEnd),
      ])
      setMonthEntries(cur); setPrevEntries(pre)
    } catch {}
    setMonthLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'monthly') loadMonth(monthDate)
  }, [tab, monthDate, loadMonth])

  // ── Overview derived values ──────────────────────────────────────────────
  const today   = format(new Date(), 'yyyy-MM-dd')
  const last7   = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map(d => format(d, 'yyyy-MM-dd'))

  const minsByDate = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + e.duration_minutes; return acc
  }, {})

  let streak = 0
  const sd = new Date()
  while (true) {
    const key = format(sd, 'yyyy-MM-dd')
    if (minsByDate[key] > 0) { streak++; sd.setDate(sd.getDate() - 1) } else break
  }

  const totalMins  = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const last7Mins  = entries.filter(e => last7.includes(e.date)).reduce((s, e) => s + e.duration_minutes, 0)
  const avgDay     = Math.round(last7Mins / 7)
  const catStats   = CATEGORIES
    .map(c => ({ ...c, mins: entries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0), sessions: entries.filter(e => e.category === c.value).length }))
    .sort((a, b) => b.mins - a.mins)
  const maxCatMins = Math.max(...catStats.map(c => c.mins), 1)

  const heatStart = startOfWeek(subDays(new Date(), 34), { weekStartsOn: 1 })
  const heatEnd   = endOfWeek(new Date(), { weekStartsOn: 1 })
  const heatDays  = eachDayOfInterval({ start: heatStart, end: heatEnd }).map(d => format(d, 'yyyy-MM-dd'))
  const heatWeeks: string[][] = []
  for (let i = 0; i < heatDays.length; i += 7) heatWeeks.push(heatDays.slice(i, i + 7))

  function heatColor(mins: number) {
    if (!mins) return 'var(--surface-3)'
    const t = Math.min(mins / 180, 1)
    if (t < 0.25) return 'rgba(99,102,241,0.25)'
    if (t < 0.5)  return 'rgba(99,102,241,0.50)'
    if (t < 0.75) return 'rgba(99,102,241,0.75)'
    return '#818cf8'
  }

  const topDayMins = Math.max(...last7.map(d => minsByDate[d] ?? 0), 1)

  // ── Monthly derived values ───────────────────────────────────────────────
  const curMins  = monthEntries.reduce((s, e) => s + e.duration_minutes, 0)
  const prevMins = prevEntries.reduce((s, e)  => s + e.duration_minutes, 0)
  const curSess  = monthEntries.length
  const prevSess = prevEntries.length
  const curAvg   = getDaysInMonth(monthDate) > 0 ? Math.round(curMins / getDaysInMonth(monthDate)) : 0
  const prevAvg  = getDaysInMonth(subMonths(monthDate, 1)) > 0 ? Math.round(prevMins / getDaysInMonth(subMonths(monthDate, 1))) : 0

  const curDates = monthEntries.reduce<Record<string,number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + e.duration_minutes; return acc
  }, {})
  const bestDay = Object.entries(curDates).sort(([,a],[,b]) => b-a)[0]

  const curCatMins  = CATEGORIES.map(c => ({ ...c, cur:  monthEntries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0), prev: prevEntries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0) }))
  const maxBarMins  = Math.max(...curCatMins.map(c => Math.max(c.cur, c.prev)), 1)

  // Month calendar heatmap
  const mStart   = startOfMonth(monthDate)
  const mEnd     = endOfMonth(monthDate)
  const mDays    = eachDayOfInterval({ start: mStart, end: mEnd }).map(d => format(d, 'yyyy-MM-dd'))
  // Pad start of month to Monday
  const startDow = (mStart.getDay() + 6) % 7  // 0=Mon
  const calPad   = Array(startDow).fill(null) as (string | null)[]
  const calCells = [...calPad, ...mDays]

  function delta(cur: number, prev: number) {
    if (!prev && !cur) return null
    if (!prev)   return { pct: 100, dir: 'up' as const }
    const p = Math.round(((cur - prev) / prev) * 100)
    if (p > 0)  return { pct: p,  dir: 'up'   as const }
    if (p < 0)  return { pct: -p, dir: 'down' as const }
    return { pct: 0, dir: 'flat' as const }
  }

  function DeltaBadge({ cur, prev }: { cur: number; prev: number }) {
    const d = delta(cur, prev)
    if (!d) return null
    if (d.dir === 'flat') return <span style={{ fontSize:11, color:'var(--ink-4)', display:'flex', alignItems:'center', gap:2 }}><Minus size={10} /> no change</span>
    const color = d.dir === 'up' ? '#22c55e' : '#ef4444'
    const Icon  = d.dir === 'up' ? ArrowUp : ArrowDown
    return (
      <span style={{ fontSize:11, fontWeight:600, color, display:'flex', alignItems:'center', gap:2 }}>
        <Icon size={10} /> {d.pct}%
      </span>
    )
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--ink-4)', fontSize:13 }}>Loading…</div>

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 className="title-page" style={{ marginBottom: 4 }}>Stats</h1>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', gap:2, padding:'3px', background:'var(--surface-2)', borderRadius:10, width:'fit-content', marginBottom:20 }}>
        {([
          { id:'overview' as Tab, label:'📊 Overview' },
          { id:'monthly'  as Tab, label:'📅 Monthly'  },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'7px 14px', borderRadius:7, border:'none', cursor:'pointer',
            background: tab === t.id ? 'var(--surface-4)' : 'transparent',
            color:      tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
            fontSize:13, fontWeight: tab === t.id ? 600 : 400,
            transition:'all 120ms', whiteSpace:'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {tab === 'overview' && (
        <>
          {/* Top metrics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
            {[
              { icon: <Flame size={14} style={{ color:'#f59e0b' }} />, value: streak,         label:'Day streak',    sub:'days in a row'  },
              { icon: <Clock size={14} style={{ color:'#818cf8' }} />, value: fmt(last7Mins),  label:'This week',     sub:'studied'        },
              { icon: <TrendingUp size={14} style={{ color:'#34d399' }} />, value: fmt(totalMins), label:'60-day total', sub:'hours'         },
              { icon: <CalendarDays size={14} style={{ color:'#c084fc' }} />, value: fmt(avgDay), label:'Daily avg',   sub:'this week'      },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>{s.icon}<span style={{ fontSize:11, color:'var(--ink-3)' }}>{s.label}</span></div>
                <div className="stat-num" style={{ marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--ink-4)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="card" style={{ padding:'16px 18px', marginBottom:16 }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>Activity heatmap</div>
            <div style={{ display:'flex', gap:4 }}>
              {heatWeeks.map((week, wi) => (
                <div key={wi} style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
                  {week.map(day => {
                    const mins = minsByDate[day] ?? 0
                    const isToday = day === today
                    return (
                      <div key={day} title={`${format(parseISO(day), 'MMM d')}: ${mins ? fmt(mins) : 'No study'}`}
                        style={{ aspectRatio:'1', borderRadius:4, background:heatColor(mins), outline: isToday ? '2px solid #6366f1' : 'none', outlineOffset:1 }} />
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginTop:10 }}>
              <span style={{ fontSize:11, color:'var(--ink-4)' }}>Less</span>
              {[0,45,90,135,180].map(v => <div key={v} style={{ width:10, height:10, borderRadius:3, background:heatColor(v) }} />)}
              <span style={{ fontSize:11, color:'var(--ink-4)' }}>More</span>
            </div>
          </div>

          {/* Last 7 days bar */}
          <div className="card" style={{ padding:'16px 18px', marginBottom:16 }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>Last 7 days</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
              {last7.map(d => {
                const mins = minsByDate[d] ?? 0
                const pct  = Math.round((mins / topDayMins) * 100)
                const isToday = d === today
                return (
                  <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%' }}>
                    <div style={{ flex:1, display:'flex', alignItems:'flex-end', width:'100%' }}>
                      <div style={{ width:'100%', height: mins > 0 ? `${Math.max(pct,8)}%` : 4, borderRadius:'4px 4px 2px 2px', background: isToday ? '#6366f1' : mins > 0 ? '#4f46e5' : 'var(--surface-3)', transition:'height 300ms ease' }} title={mins ? fmt(mins) : 'No study'} />
                    </div>
                    <span style={{ fontSize:10, color: isToday ? '#818cf8' : 'var(--ink-4)', fontWeight: isToday ? 700 : 400 }}>{format(parseISO(d), 'EEE')}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="card" style={{ padding:'16px 18px' }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>By category</div>
            {catStats.filter(c => c.mins > 0).length === 0 ? (
              <p style={{ color:'var(--ink-4)', fontSize:13 }}>No data yet. Start logging!</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {catStats.map(c => {
                  if (!c.mins) return null
                  const pct = Math.round((c.mins / maxCatMins) * 100)
                  return (
                    <div key={c.value}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontSize:13, color:'var(--ink)', fontWeight:500 }}>{c.icon} {c.value}</span>
                        <span style={{ fontSize:12, color:'var(--ink-3)', fontVariantNumeric:'tabular-nums' }}>{fmt(c.mins)} · {c.sessions} sessions</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width:`${pct}%`, background:c.color }} /></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════ MONTHLY TAB ══════════════ */}
      {tab === 'monthly' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Month navigator */}
          <div className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={() => setMonthDate(d => subMonths(d, 1))} style={{
              background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8,
              padding:'6px 8px', cursor:'pointer', color:'var(--ink-3)', display:'flex',
            }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:16, fontWeight:600, color:'var(--ink)', margin:0, letterSpacing:'-0.02em' }}>
                {format(monthDate, 'MMMM yyyy')}
              </p>
              <p style={{ fontSize:11, color:'var(--ink-4)', margin:'2px 0 0' }}>
                vs {format(subMonths(monthDate, 1), 'MMM yyyy')}
              </p>
            </div>
            <button onClick={() => setMonthDate(d => addDays(endOfMonth(d), 1))}
              disabled={format(monthDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
              style={{
                background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8,
                padding:'6px 8px', cursor:'pointer', color:'var(--ink-3)', display:'flex',
                opacity: format(monthDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM') ? 0.3 : 1,
              }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {monthLoading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)', fontSize:13 }}>Loading…</div>
          ) : (
            <>
              {/* Key metric comparison cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {[
                  { label: 'Total hours', cur: curMins,  prev: prevMins,  fmt: (m: number) => fmt(m) },
                  { label: 'Sessions',    cur: curSess,  prev: prevSess,  fmt: (n: number) => String(n) },
                  { label: 'Daily avg',   cur: curAvg,   prev: prevAvg,   fmt: (m: number) => fmt(m) },
                  { label: 'Best day',    cur: bestDay ? bestDay[1] : 0, prev: 0, fmt: (m: number) => m ? fmt(m) : '—' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding:'14px 16px' }}>
                    <div className="eyebrow" style={{ marginBottom:6 }}>{s.label}</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontSize:26, fontWeight:300, letterSpacing:'-0.04em', color:'var(--ink)', fontVariantNumeric:'tabular-nums' }}>
                        {s.fmt(s.cur)}
                      </span>
                      <DeltaBadge cur={s.cur} prev={s.prev} />
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:3 }}>
                      was {s.fmt(s.prev)} last month
                    </div>
                  </div>
                ))}
              </div>

              {/* Best day callout */}
              {bestDay && (
                <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>🏆</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:'var(--ink)', margin:0 }}>
                      Best day: {format(parseISO(bestDay[0]), 'EEE, MMM d')}
                    </p>
                    <p style={{ fontSize:12, color:'var(--ink-3)', margin:'2px 0 0' }}>{fmt(bestDay[1])} studied</p>
                  </div>
                </div>
              )}

              {/* Category comparison — side-by-side bars */}
              <div className="card" style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <span className="eyebrow">By category</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:11, color:'var(--ink-4)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'#6366f1', display:'inline-block' }} />{format(monthDate, 'MMM')}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'rgba(99,102,241,0.25)', display:'inline-block' }} />{format(subMonths(monthDate,1), 'MMM')}</span>
                  </div>
                </div>
                {curCatMins.filter(c => c.cur > 0 || c.prev > 0).length === 0 ? (
                  <p style={{ color:'var(--ink-4)', fontSize:13 }}>No data for this month yet.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {curCatMins.filter(c => c.cur > 0 || c.prev > 0).map(c => {
                      const curPct  = Math.round((c.cur  / maxBarMins) * 100)
                      const prevPct = Math.round((c.prev / maxBarMins) * 100)
                      return (
                        <div key={c.value}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                            <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{c.icon} {c.value}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink-3)' }}>
                              <span style={{ color:'var(--ink)', fontWeight:600 }}>{fmt(c.cur)}</span>
                              {c.prev > 0 && <span style={{ color:'var(--ink-4)' }}>/ {fmt(c.prev)}</span>}
                              <DeltaBadge cur={c.cur} prev={c.prev} />
                            </div>
                          </div>
                          {/* Current month bar */}
                          <div className="progress-track" style={{ marginBottom:3 }}>
                            <div className="progress-fill" style={{ width:`${curPct}%`, background:c.color }} />
                          </div>
                          {/* Previous month bar (dimmed) */}
                          {c.prev > 0 && (
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width:`${prevPct}%`, background:`${c.color}40` }} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Mini calendar heatmap for the month */}
              <div className="card" style={{ padding:'16px 18px' }}>
                <div className="eyebrow" style={{ marginBottom:10 }}>Daily activity — {format(monthDate, 'MMMM')}</div>
                {/* Weekday headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--ink-4)', fontWeight:600 }}>{d}</div>
                  ))}
                </div>
                {/* Calendar cells */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {calCells.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />
                    const mins    = curDates[day] ?? 0
                    const isToday = day === today
                    return (
                      <div key={day} title={`${format(parseISO(day),'MMM d')}: ${mins ? fmt(mins) : 'No study'}`} style={{
                        aspectRatio: '1', borderRadius: 4,
                        background:  heatColor(mins),
                        outline:     isToday ? '2px solid #6366f1' : 'none', outlineOffset: 1,
                      }} />
                    )
                  })}
                </div>
                {/* Legend */}
                <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginTop:8 }}>
                  <span style={{ fontSize:10, color:'var(--ink-4)' }}>Less</span>
                  {[0,45,90,135,180].map(v => <div key={v} style={{ width:10, height:10, borderRadius:2, background:heatColor(v) }} />)}
                  <span style={{ fontSize:10, color:'var(--ink-4)' }}>More</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}
