'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEntriesForDateRange } from '@/lib/db'
import { LogEntry, CATEGORIES } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { Flame, Clock, TrendingUp, CalendarDays } from 'lucide-react'

export default function StatsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const from = format(subDays(new Date(), 60), 'yyyy-MM-dd')
    const to   = format(new Date(), 'yyyy-MM-dd')
    setEntries(await getEntriesForDateRange(from, to))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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

  const totalMins = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const last7Mins = entries.filter(e => last7.includes(e.date)).reduce((s, e) => s + e.duration_minutes, 0)
  const avgDay    = Math.round(last7Mins / 7)
  const fmt = (m: number) => { const h = Math.floor(m/60), mn = m%60; return h > 0 ? `${h}h${mn > 0 ? ` ${mn}m` : ''}` : `${mn}m` }

  const catStats = CATEGORIES
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

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--ink-4)', fontSize:13 }}>Loading…</div>

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="title-page" style={{ marginBottom:4 }}>Stats</h1>
        <p style={{ fontSize:13, color:'var(--ink-3)' }}>Last 60 days</p>
      </div>

      {/* Top metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
        {[
          { icon: <Flame size={14} style={{ color:'#f59e0b' }} />, value: streak,       label:'Day streak',    sub:'days in a row' },
          { icon: <Clock size={14} style={{ color:'#818cf8' }} />, value: fmt(last7Mins),label:'This week',    sub:'studied' },
          { icon: <TrendingUp size={14} style={{ color:'#34d399' }} />, value: fmt(totalMins), label:'60-day total', sub:'hours' },
          { icon: <CalendarDays size={14} style={{ color:'#c084fc' }} />, value: fmt(avgDay), label:'Daily avg',   sub:'this week' },
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
                    style={{ aspectRatio:'1', borderRadius:4, background:heatColor(mins), outline: isToday ? '2px solid #6366f1' : 'none', outlineOffset:1 }}
                  />
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
    </div>
  )
}
