'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getLogEntries } from '@/lib/db'
import { LogEntry, CATEGORIES } from '@/lib/supabase'
import { Sparkles, Send, AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Message { role: 'user' | 'assistant'; text: string }

const QUICK_PROMPTS = [
  { icon: '🧭', text: 'What should I study today?' },
  { icon: '⚠️', text: 'What topics have I been neglecting?' },
  { icon: '📅', text: 'Build me a 2-week study plan' },
  { icon: '🔎', text: "How's my prep looking? Be honest." },
  { icon: '💡', text: "What's the highest ROI topic this week?" },
  { icon: '⏱️', text: 'I have 2 hours tonight — what should I do?' },
]

function buildContext(entries: LogEntry[]): string {
  if (!entries.length) return 'No study sessions logged yet.'
  const byDate = entries.reduce<Record<string, LogEntry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e); return acc
  }, {})
  const lines: string[] = []
  Object.keys(byDate).sort((a,b) => b.localeCompare(a)).slice(0,14).forEach(date => {
    const es = byDate[date], mins = es.reduce((s,e) => s + e.duration_minutes, 0)
    lines.push(`\n${date} (${(mins/60).toFixed(1)}h):`)
    es.forEach(e => lines.push(`  - [${e.category}] ${e.topic} (${e.duration_minutes}min)${e.notes ? ` — ${e.notes}` : ''}`))
  })
  const summary = CATEGORIES.map(c => {
    const m = entries.filter(e => e.category === c.value).reduce((s,e) => s + e.duration_minutes, 0)
    return `${c.value}: ${(m/60).toFixed(1)}h`
  }).join(', ')
  return `Totals (30d) — ${summary}\n\nLog:${lines.join('\n')}`
}

export default function CoachPage() {
  const [entries, setEntries]   = useState<LogEntry[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [noKey, setNoKey]       = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => { getLogEntries(100).then(setEntries).catch(() => {}) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }])
    setInput(''); setLoading(true); setNoKey(false)
    try {
      const res  = await fetch('/api/coach', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: text.trim(), context: buildContext(entries) }) })
      const data = await res.json()
      if (data.error === 'NO_KEY') { setNoKey(true); setMessages(prev => prev.slice(0,-1)) }
      else setMessages(prev => [...prev, { role:'assistant', text: data.response }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', text:'Something went wrong. Try again.' }])
    } finally { setLoading(false) }
  }, [loading, entries])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 32px', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div>
        <h1 className="title-page" style={{ marginBottom:4 }}>AI Coach</h1>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Sparkles size={12} style={{ color:'#818cf8' }} />
          <span style={{ fontSize:12, color:'var(--ink-3)' }}>Claude · reads your full study log</span>
        </div>
      </div>

      {/* No key warning */}
      {noKey && (
        <div className="card animate-in" style={{ padding:'14px 16px', borderColor:'rgba(245,158,11,0.4)', display:'flex', gap:10 }}>
          <AlertTriangle size={14} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }} />
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#f59e0b', margin:0 }}>API key not set</p>
            <p style={{ fontSize:12, color:'var(--ink-3)', margin:'4px 0 0' }}>
              Add <code style={{ fontSize:11, background:'var(--surface-3)', padding:'1px 4px', borderRadius:4 }}>ANTHROPIC_API_KEY</code> to <code style={{ fontSize:11, background:'var(--surface-3)', padding:'1px 4px', borderRadius:4 }}>.env.local</code> and restart.
            </p>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {/* Empty state — quick prompts */}
        {messages.length === 0 && (
          <div className="card animate-in" style={{ padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={14} style={{ color:'#fff' }} />
              </div>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.02em' }}>Your AI Study Coach</span>
            </div>
            <p style={{ fontSize:13, color:'var(--ink-3)', margin:'8px 0 16px', lineHeight:1.5 }}>
              I have full context of your study log. Ask me anything about gaps, next topics, or your overall prep.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.text}
                  onClick={() => send(p.text)}
                  style={{
                    textAlign:'left',
                    padding:'10px 12px',
                    borderRadius:8,
                    background:'var(--surface-2)',
                    border:'1px solid var(--line)',
                    color:'var(--ink-2)',
                    fontSize:12,
                    cursor:'pointer',
                    transition:'background 120ms, border-color 120ms',
                    display:'flex',
                    alignItems:'flex-start',
                    gap:6,
                    lineHeight:1.4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-strong)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className="animate-in" style={{
            display:'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {m.role === 'user' ? (
              <div style={{
                maxWidth:'78%',
                padding:'10px 14px',
                borderRadius:'14px 14px 4px 14px',
                background:'#6366f1',
                color:'#fff',
                fontSize:13,
                lineHeight:1.5,
              }}>
                {m.text}
              </div>
            ) : (
              <div className="card" style={{ padding:'14px 16px', width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <Sparkles size={12} style={{ color:'#818cf8' }} />
                  <span className="eyebrow" style={{ color:'#818cf8' }}>Coach</span>
                  <span style={{ fontSize:11, color:'var(--ink-4)', marginLeft:'auto' }}>{format(new Date(), 'h:mm a')}</span>
                </div>
                <div style={{ fontSize:13, color:'var(--ink)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="card animate-in" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <Loader2 size={13} className="animate-spin" style={{ color:'#6366f1' }} />
            <span style={{ fontSize:12, color:'var(--ink-3)' }}>Thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Sticky input bar (Stripe pill style) ── */}
      <div style={{
        position: 'sticky',
        bottom: 'calc(60px + env(safe-area-inset-bottom) + 8px)',
      }}>
        <div style={{
          display:'flex',
          alignItems:'flex-end',
          gap:8,
          padding:'8px 8px 8px 14px',
          borderRadius:14,
          background:'var(--surface-1)',
          border:'1px solid var(--line-strong)',
          boxShadow:'0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your coach anything…"
            rows={1}
            style={{
              flex:1, width:'auto',
              background:'transparent',
              border:'none', outline:'none', boxShadow:'none',
              resize:'none',
              minHeight:36, maxHeight:120,
              padding:'6px 0',
              fontSize:14,
              color:'var(--ink)',
            }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ padding:'8px 14px', borderRadius:10, flexShrink:0 }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
