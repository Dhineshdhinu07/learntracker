'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProblemLog, Difficulty, ProblemStatus, Category, CATEGORIES } from '@/lib/supabase'
import { getProblemLog, addProblem, updateProblemStatus, deleteProblem } from '@/lib/db'
import { format } from 'date-fns'
import { Plus, ExternalLink, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']
const STATUSES: ProblemStatus[]  = ['Todo', 'Attempted', 'Solved', 'Revisit']

const DIFF_STYLE: Record<Difficulty, { text: string; bg: string; border: string }> = {
  Easy:   { text: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)'  },
  Medium: { text: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  Hard:   { text: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)'  },
}

const STATUS_STYLE: Record<ProblemStatus, { text: string; bg: string }> = {
  Todo:      { text: 'var(--ink-4)', bg: 'var(--surface-3)' },
  Attempted: { text: '#f59e0b',      bg: 'rgba(245,158,11,0.10)' },
  Solved:    { text: '#22c55e',      bg: 'rgba(34,197,94,0.10)'  },
  Revisit:   { text: '#818cf8',      bg: 'rgba(99,102,241,0.10)' },
}

const STATUS_NEXT: Record<ProblemStatus, ProblemStatus> = {
  Todo: 'Attempted', Attempted: 'Solved', Solved: 'Revisit', Revisit: 'Todo',
}

const SQL_HINT = `-- Run this in Supabase SQL editor:
create table problem_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  title text not null,
  url text,
  difficulty text not null,
  status text not null default 'Todo',
  category text not null default 'DSA',
  notes text,
  date date not null default current_date,
  created_at timestamptz default now()
);`

type Filter = 'All' | Difficulty | 'Solved' | 'Unsolved'

const BLANK_FORM = { title: '', url: '', difficulty: 'Easy' as Difficulty, status: 'Todo' as ProblemStatus, category: 'DSA' as Category, notes: '' }

export default function ProblemsTab() {
  const [problems,    setProblems]    = useState<ProblemLog[]>([])
  const [loading,     setLoading]     = useState(true)
  const [dbErr,       setDbErr]       = useState(false)
  const [filter,      setFilter]      = useState<Filter>('All')
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({ ...BLANK_FORM })
  const [saving,      setSaving]      = useState(false)
  const [formErr,     setFormErr]     = useState('')

  const load = useCallback(async () => {
    try { setProblems(await getProblemLog()); setDbErr(false) }
    catch { setDbErr(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = problems.filter(p => {
    if (filter === 'All')     return true
    if (filter === 'Solved')  return p.status === 'Solved'
    if (filter === 'Unsolved') return p.status !== 'Solved'
    return p.difficulty === filter
  })

  const stats = {
    easy:   problems.filter(p => p.difficulty === 'Easy'   && p.status === 'Solved').length,
    medium: problems.filter(p => p.difficulty === 'Medium' && p.status === 'Solved').length,
    hard:   problems.filter(p => p.difficulty === 'Hard'   && p.status === 'Solved').length,
    total:  problems.filter(p => p.status === 'Solved').length,
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setFormErr('Enter a problem title'); return }
    setSaving(true); setFormErr('')
    try {
      await addProblem({ ...form, title: form.title.trim(), url: form.url.trim() || null, notes: form.notes.trim() || null, date: format(new Date(), 'yyyy-MM-dd') })
      setForm({ ...BLANK_FORM }); setShowForm(false); load()
    } catch { setFormErr('Save failed. Check Supabase.') }
    finally { setSaving(false) }
  }

  async function cycleStatus(p: ProblemLog) {
    const next = STATUS_NEXT[p.status]
    setProblems(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x))
    try { await updateProblemStatus(p.id, next) }
    catch { load() }
  }

  async function handleDelete(id: string) {
    setProblems(prev => prev.filter(p => p.id !== id))
    try { await deleteProblem(id) }
    catch { load() }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)', fontSize:13 }}>Loading…</div>

  if (dbErr) return (
    <div className="card animate-in" style={{ padding:'18px 20px', borderColor:'rgba(245,158,11,0.35)', marginTop:4 }}>
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <AlertCircle size={15} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }} />
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'#f59e0b', margin:0 }}>Table not found</p>
          <p style={{ fontSize:12, color:'var(--ink-3)', margin:'4px 0 0' }}>Run the SQL below in your Supabase dashboard to create the <code>problem_log</code> table.</p>
        </div>
      </div>
      <pre style={{ fontSize:11, background:'var(--surface-3)', borderRadius:8, padding:'12px 14px', overflow:'auto', color:'var(--ink-3)', margin:0, lineHeight:1.6 }}>{SQL_HINT}</pre>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {[
          { label:'Easy', value: stats.easy,   color: '#22c55e' },
          { label:'Med',  value: stats.medium, color: '#f59e0b' },
          { label:'Hard', value: stats.hard,   color: '#ef4444' },
          { label:'Total solved', value: stats.total, color: '#818cf8' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:300, letterSpacing:'-0.04em', color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + Add */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {(['All','Easy','Medium','Hard','Solved','Unsolved'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'4px 10px', borderRadius:6, fontSize:12, cursor:'pointer', border:'1px solid',
              fontWeight: filter === f ? 700 : 500,
              background: filter === f ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
              color:      filter === f ? '#818cf8' : 'var(--ink-3)',
              borderColor: filter === f ? 'rgba(99,102,241,0.3)' : 'var(--line)',
            }}>{f}</button>
          ))}
        </div>
        <button onClick={() => { setShowForm(f => !f); setFormErr('') }} className="btn-primary" style={{ padding:'7px 14px', borderRadius:9999, fontSize:12 }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card animate-in" style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span className="title-card">Add problem</span>
            <button type="button" onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', padding:4 }}>
              <ChevronUp size={14} />
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label>Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Two Sum" />
            </div>
            <div>
              <label>LeetCode URL <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://leetcode.com/problems/two-sum/" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label>Difficulty</label>
                <div style={{ display:'flex', gap:6 }}>
                  {DIFFICULTIES.map(d => {
                    const s = DIFF_STYLE[d]
                    const active = form.difficulty === d
                    return (
                      <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))} style={{
                        flex:1, padding:'7px 4px', borderRadius:7, border:'1px solid', fontSize:12, cursor:'pointer',
                        background: active ? s.bg : 'var(--surface-2)',
                        color:      active ? s.text : 'var(--ink-3)',
                        borderColor: active ? s.border : 'var(--line)',
                        fontWeight: active ? 700 : 400,
                      }}>{d}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProblemStatus }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
              </select>
            </div>
            <div>
              <label>Notes <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key patterns, tricky parts…" style={{ minHeight:56 }} />
            </div>
            {formErr && <p style={{ fontSize:12, color:'var(--red)', margin:0 }}>{formErr}</p>}
            <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={saving}>
              {saving ? 'Saving…' : 'Add Problem'}
            </button>
          </div>
        </form>
      )}

      {/* Problem list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-4)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🧩</div>
          <p style={{ fontSize:13 }}>{problems.length === 0 ? 'No problems logged yet. Add your first!' : 'No problems match this filter.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(p => {
            const ds = DIFF_STYLE[p.difficulty]
            const ss = STATUS_STYLE[p.status]
            return (
              <div key={p.id} className="card-interactive" style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  {/* Difficulty dot */}
                  <div style={{ width:8, height:8, borderRadius:'50%', background:ds.text, flexShrink:0, marginTop:5 }} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ fontSize:14, fontWeight:500, color:'var(--ink)', letterSpacing:'-0.01em', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                          {p.title} <ExternalLink size={11} style={{ color:'var(--ink-4)' }} />
                        </a>
                      ) : (
                        <span style={{ fontSize:14, fontWeight:500, color:'var(--ink)', letterSpacing:'-0.01em' }}>{p.title}</span>
                      )}
                      {/* Difficulty chip */}
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:5, background:ds.bg, color:ds.text, border:`1px solid ${ds.border}` }}>{p.difficulty}</span>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
                      {/* Status badge — clickable to cycle */}
                      <button onClick={() => cycleStatus(p)} title="Click to change status" style={{
                        padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer',
                        background: ss.bg, color: ss.text, border: 'none', transition:'opacity 120ms',
                      }}>
                        {p.status}
                      </button>
                      <span style={{ fontSize:11, color:'var(--ink-4)' }}>
                        {CATEGORIES.find(c => c.value === p.category)?.icon} {p.category}
                      </span>
                      <span style={{ fontSize:11, color:'var(--ink-4)' }}>{format(new Date(p.date + 'T00:00'), 'MMM d')}</span>
                    </div>

                    {p.notes && (
                      <p style={{ fontSize:12, color:'var(--ink-4)', margin:'6px 0 0', lineHeight:1.5 }}>{p.notes}</p>
                    )}
                  </div>

                  {/* Delete */}
                  <button onClick={() => handleDelete(p.id)} style={{
                    background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', padding:4,
                    opacity:0.6, flexShrink:0,
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-4)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
