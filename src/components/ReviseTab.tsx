'use client'

import { useState, useEffect, useCallback } from 'react'
import { RevisionTopic, Category, CATEGORIES } from '@/lib/supabase'
import { getRevisionTopics, addRevisionTopic, markRevisionReviewed, deleteRevisionTopic } from '@/lib/db'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { Plus, Check, Trash2, ChevronDown, AlertCircle, RotateCcw } from 'lucide-react'

const INTERVALS = [
  { label: '1d',  days: 1  },
  { label: '3d',  days: 3  },
  { label: '7d',  days: 7  },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
]

const SQL_HINT = `-- Run this in Supabase SQL editor:
create table revision_topics (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  topic text not null,
  category text not null,
  interval_days int not null default 7,
  last_reviewed date not null default current_date,
  next_review date not null,
  notes text,
  created_at timestamptz default now()
);`

const TINT_MAP: Record<string, { text: string; bg: string; border: string }> = {
  'DSA':                  { text:'#818cf8', bg:'rgba(99,102,241,0.10)',  border:'rgba(99,102,241,0.25)'  },
  'Python':               { text:'#38bdf8', bg:'rgba(14,165,233,0.10)',  border:'rgba(14,165,233,0.25)'  },
  'System Design':        { text:'#34d399', bg:'rgba(16,185,129,0.10)',  border:'rgba(16,185,129,0.25)'  },
  'Computer Fundamentals':{ text:'#fbbf24', bg:'rgba(245,158,11,0.10)',  border:'rgba(245,158,11,0.25)'  },
  'Frontend':             { text:'#f472b6', bg:'rgba(236,72,153,0.10)',  border:'rgba(236,72,153,0.25)'  },
  'Backend':              { text:'#c084fc', bg:'rgba(139,92,246,0.10)',  border:'rgba(139,92,246,0.25)'  },
  'Other':                { text:'#9ca3af', bg:'rgba(107,114,128,0.10)', border:'rgba(107,114,128,0.20)' },
}

const BLANK = { topic: '', category: 'DSA' as Category, intervalDays: 7, notes: '' }

export default function ReviseTab() {
  const [topics,   setTopics]   = useState<RevisionTopic[]>([])
  const [loading,  setLoading]  = useState(true)
  const [dbErr,    setDbErr]    = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ ...BLANK })
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')
  const [showAll,  setShowAll]  = useState(false)
  const [marking,  setMarking]  = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const in3   = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    try { setTopics(await getRevisionTopics()); setDbErr(false) }
    catch { setDbErr(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const due     = topics.filter(t => t.next_review <= today)
  const soon    = topics.filter(t => t.next_review > today && t.next_review <= in3)
  const upcoming= topics.filter(t => t.next_review > in3)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.topic.trim()) { setFormErr('Enter a topic name'); return }
    setSaving(true); setFormErr('')
    try {
      const next = format(addDays(new Date(), form.intervalDays), 'yyyy-MM-dd')
      await addRevisionTopic({
        topic: form.topic.trim(),
        category: form.category,
        interval_days: form.intervalDays,
        last_reviewed: today,
        next_review: next,
        notes: form.notes.trim() || null,
      })
      setForm({ ...BLANK }); setShowForm(false); load()
    } catch { setFormErr('Save failed. Check Supabase.') }
    finally { setSaving(false) }
  }

  async function handleReview(t: RevisionTopic) {
    setMarking(t.id)
    try {
      await markRevisionReviewed(t.id, t.interval_days)
      load()
    } catch { /* silently fallback */ }
    finally { setMarking(null) }
  }

  async function handleDelete(id: string) {
    setTopics(prev => prev.filter(t => t.id !== id))
    try { await deleteRevisionTopic(id) }
    catch { load() }
  }

  function dueLabel(next: string) {
    const diff = differenceInDays(parseISO(next), new Date())
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: '#ef4444' }
    if (diff === 0) return { text: 'Due today', color: '#f59e0b' }
    return { text: `Due in ${diff}d`, color: 'var(--ink-3)' }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)', fontSize:13 }}>Loading…</div>

  if (dbErr) return (
    <div className="card animate-in" style={{ padding:'18px 20px', borderColor:'rgba(245,158,11,0.35)', marginTop:4 }}>
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <AlertCircle size={15} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }} />
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'#f59e0b', margin:0 }}>Table not found</p>
          <p style={{ fontSize:12, color:'var(--ink-3)', margin:'4px 0 0' }}>Run the SQL below in your Supabase dashboard to create the <code>revision_topics</code> table.</p>
        </div>
      </div>
      <pre style={{ fontSize:11, background:'var(--surface-3)', borderRadius:8, padding:'12px 14px', overflow:'auto', color:'var(--ink-3)', margin:0, lineHeight:1.6 }}>{SQL_HINT}</pre>
    </div>
  )

  function TopicCard({ t, showDue = true }: { t: RevisionTopic; showDue?: boolean }) {
    const tint  = TINT_MAP[t.category]
    const label = dueLabel(t.next_review)
    const cat   = CATEGORIES.find(c => c.value === t.category)
    return (
      <div className="card" style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
              <span style={{ fontSize:14, fontWeight:500, color:'var(--ink)', letterSpacing:'-0.01em' }}>{t.topic}</span>
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:5, background:tint.bg, color:tint.text, border:`1px solid ${tint.border}` }}>
                {cat?.icon} {t.category}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {showDue && <span style={{ fontSize:11, fontWeight:600, color: label.color }}>{label.text}</span>}
              <span style={{ fontSize:11, color:'var(--ink-4)' }}>
                <RotateCcw size={10} style={{ display:'inline', marginRight:3, verticalAlign:'middle' }} />
                Every {t.interval_days}d
              </span>
              <span style={{ fontSize:11, color:'var(--ink-4)' }}>Last: {format(parseISO(t.last_reviewed), 'MMM d')}</span>
            </div>
            {t.notes && <p style={{ fontSize:12, color:'var(--ink-4)', margin:'5px 0 0', lineHeight:1.5 }}>{t.notes}</p>}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => handleReview(t)} disabled={marking === t.id} title="Mark as reviewed" style={{
              padding:'6px 10px', borderRadius:7, border:'1px solid rgba(34,197,94,0.3)',
              background:'rgba(34,197,94,0.08)', color:'#22c55e', cursor:'pointer',
              fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4,
              opacity: marking === t.id ? 0.5 : 1,
            }}>
              <Check size={12} /> {marking === t.id ? '…' : 'Done'}
            </button>
            <button onClick={() => handleDelete(t.id)} style={{
              background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', padding:4,
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-4)'}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { label: 'Due now',   value: due.length,      color: due.length > 0 ? '#f59e0b' : 'var(--ink-3)' },
          { label: 'This week', value: soon.length,     color: '#818cf8' },
          { label: 'Tracked',   value: topics.length,   color: 'var(--ink-3)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:300, letterSpacing:'-0.04em', color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={() => { setShowForm(f => !f); setFormErr('') }} className="btn-primary" style={{ padding:'7px 14px', borderRadius:9999, fontSize:12 }}>
          <Plus size={13} /> Track topic
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card animate-in" style={{ padding:'18px 20px' }}>
          <span className="title-card" style={{ display:'block', marginBottom:14 }}>Track a topic</span>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label>Topic name</label>
              <input type="text" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Binary Trees, React Hooks, TCP/IP…" autoFocus />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                </select>
              </div>
              <div>
                <label>Review interval</label>
                <div style={{ display:'flex', gap:4 }}>
                  {INTERVALS.map(i => (
                    <button key={i.days} type="button" onClick={() => setForm(f => ({ ...f, intervalDays: i.days }))} style={{
                      flex:1, padding:'7px 2px', borderRadius:7, border:'1px solid', fontSize:11, cursor:'pointer',
                      fontWeight: form.intervalDays === i.days ? 700 : 400,
                      background: form.intervalDays === i.days ? 'rgba(99,102,241,0.14)' : 'var(--surface-2)',
                      color:      form.intervalDays === i.days ? '#818cf8' : 'var(--ink-3)',
                      borderColor: form.intervalDays === i.days ? 'rgba(99,102,241,0.4)' : 'var(--line)',
                    }}>{i.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label>Notes <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key concepts, resources…" style={{ minHeight:52 }} />
            </div>
            {formErr && <p style={{ fontSize:12, color:'var(--red)', margin:0 }}>{formErr}</p>}
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" className="btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={saving}>
                {saving ? 'Saving…' : 'Track Topic'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {topics.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔁</div>
          <p style={{ fontSize:13, maxWidth:260, margin:'0 auto', lineHeight:1.6 }}>No topics tracked yet. Add topics you want to revise on a schedule — spaced repetition style.</p>
        </div>
      ) : (
        <>
          {/* Due now */}
          {due.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom:8, color:'#f59e0b' }}>
                🔔 Due now ({due.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {due.map(t => <TopicCard key={t.id} t={t} showDue />)}
              </div>
            </div>
          )}

          {/* Coming up soon */}
          {soon.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom:8 }}>Up next (within 3 days)</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {soon.map(t => <TopicCard key={t.id} t={t} showDue />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <button onClick={() => setShowAll(s => !s)} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'none', border:'none', cursor:'pointer', padding:'2px 0',
                color:'var(--ink-3)',
              }}>
                <span className="eyebrow">All topics ({upcoming.length})</span>
                <ChevronDown size={13} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition:'transform 150ms' }} />
              </button>
              {showAll && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                  {upcoming.map(t => <TopicCard key={t.id} t={t} showDue />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
