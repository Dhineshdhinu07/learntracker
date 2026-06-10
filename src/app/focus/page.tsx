'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CATEGORIES, Category } from '@/lib/supabase'
import { addLogEntry } from '@/lib/db'
import { format, addMinutes } from 'date-fns'
import { Play, Pause, X, RotateCcw, Coffee, Check, Timer } from 'lucide-react'

// ── Design tokens for category tints ────────────────────────────────────────
const TINT_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string; glow: string }> = {
  'DSA':                  { bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'Python':               { bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'System Design':        { bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'Computer Fundamentals':{ bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'Frontend':             { bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'Backend':              { bg:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.18)', activeBg:'rgba(255,255,255,0.10)', glow:'rgba(255,255,255,0.08)' },
  'Other':                { bg:'rgba(255,255,255,0.03)', text:'rgba(255,255,255,0.5)', border:'rgba(255,255,255,0.12)', activeBg:'rgba(255,255,255,0.08)', glow:'rgba(255,255,255,0.06)' },
}

const DURATIONS = [15, 20, 25, 30, 45, 60]

// ── SVG ring constants ───────────────────────────────────────────────────────
const R   = 90          // ring radius
const CX  = 110
const CY  = 110
const CIRC = 2 * Math.PI * R   // ≈ 565.5

type Phase = 'setup' | 'running' | 'paused' | 'break' | 'done'

// Simple tone via Web Audio API (no external files)
function playTone(freq: number, durSec: number, vol = 0.25) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.type = 'sine'
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durSec)
    osc.start(); osc.stop(ctx.currentTime + durSec)
  } catch { /* silently ignore — browser may block autoplay */ }
}

export default function FocusPage() {
  // ── Setup state ──────────────────────────────────────────────────────────
  const [category,    setCategory]    = useState<Category>('DSA')
  const [topic,       setTopic]       = useState('')
  const [durationMin, setDurationMin] = useState(25)

  // ── Timer state ──────────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState<Phase>('setup')
  const [remaining,   setRemaining]   = useState(0)
  const [totalSecs,   setTotalSecs]   = useState(0)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)

  // ── Post-session state ────────────────────────────────────────────────────
  const [notes,   setNotes]   = useState('')
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // ── Responsive layout ─────────────────────────────────────────────────────
  const [isLandscape, setIsLandscape] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerHeight < 540)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running' && phase !== 'break') return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          playTone(528, 1.5)   // short 528 Hz tone on complete
          setTimeout(() => playTone(660, 1), 600)
          setPhase(p => p === 'break' ? 'setup' : 'done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase])

  // ── Actions ───────────────────────────────────────────────────────────────
  function startFocus() {
    if (!topic.trim()) return
    const secs = durationMin * 60
    setTotalSecs(secs)
    setRemaining(secs)
    setSessionStart(new Date())
    setSaved(false); setSaveErr(''); setNotes('')
    setPhase('running')
  }

  function togglePause() {
    setPhase(p => p === 'running' ? 'paused' : 'running')
  }

  function endEarly() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('done')
  }

  function startBreak(mins: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const secs = mins * 60
    setTotalSecs(secs); setRemaining(secs)
    setPhase('break')
  }

  const logSession = useCallback(async () => {
    if (!sessionStart || saving) return
    setSaving(true); setSaveErr('')
    try {
      const elapsedMins = Math.max(1, Math.round((totalSecs - remaining) / 60))
      const startStr = format(sessionStart, 'HH:mm')
      const endStr   = format(addMinutes(sessionStart, elapsedMins), 'HH:mm')
      await addLogEntry({
        category,
        topic: topic.trim(),
        start_time: startStr,
        end_time:   endStr,
        duration_minutes: elapsedMins,
        notes: notes.trim() || null,
        date:  format(sessionStart, 'yyyy-MM-dd'),
      })
      setSaved(true)
    } catch {
      setSaveErr('Save failed — check Supabase connection.')
    } finally {
      setSaving(false)
    }
  }, [sessionStart, saving, totalSecs, remaining, category, topic, notes])

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('setup'); setSaved(false); setSaveErr(''); setNotes('')
  }

  // ── SVG ring math ─────────────────────────────────────────────────────────
  const progress    = totalSecs > 0 ? (totalSecs - remaining) / totalSecs : 0
  const dashOffset  = CIRC * progress
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const elapsedLabel = `${Math.max(1, Math.round((totalSecs - remaining) / 60))}m`

  const catData     = CATEGORIES.find(c => c.value === category)
  const tint        = TINT_MAP[category]
  const ringColor   = phase === 'break' ? '#22c55e' : '#ffffff'
  const phaseLabel  = phase === 'break' ? 'Break' : phase === 'paused' ? 'Paused' : 'Focus'

  // ════════════════════════════════════════════════════════════════════════════
  //  SETUP SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Timer size={18} style={{ color: '#fff' }} />
            </div>
            <h1 className="title-page">Focus Mode</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 46 }}>Deep work, one session at a time</p>
        </div>

        {/* Category */}
        <div className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
          <label>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(c => {
              const t = TINT_MAP[c.value]
              const active = category === c.value
              return (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)} className="chip"
                  style={{
                    padding: '6px 10px', fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', transition: 'all 120ms',
                    background: active ? t.activeBg : t.bg, color: t.text,
                    borderColor: active ? t.border : 'transparent',
                    outline: active ? `1px solid ${t.border}` : 'none', outlineOffset: 1,
                  }}>
                  {c.icon} {c.value}
                </button>
              )
            })}
          </div>
        </div>

        {/* Topic */}
        <div className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
          <label>What will you study?</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Binary Trees, REST APIs, React hooks…"
            onKeyDown={e => e.key === 'Enter' && startFocus()}
            autoFocus
          />
        </div>

        {/* Duration */}
        <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
          <label>Session length</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DURATIONS.map(d => {
              const active = durationMin === d
              return (
                <button key={d} onClick={() => setDurationMin(d)} style={{
                  flex: 1, padding: '9px 4px', borderRadius: 8, border: '1px solid',
                  fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.10)' : 'var(--surface-2)',
                  color:      active ? '#ffffff' : 'var(--ink-3)',
                  borderColor: active ? 'rgba(255,255,255,0.25)' : 'var(--line)',
                  transition: 'all 120ms',
                }}>
                  {d}<span style={{ fontSize: 10 }}>m</span>
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8 }}>
            Classic Pomodoro = 25m focus → 5m break
          </p>
        </div>

        {/* Start */}
        <button
          onClick={startFocus}
          disabled={!topic.trim()}
          className="btn-primary"
          style={{
            width: '100%', justifyContent: 'center',
            padding: '14px', fontSize: 15, borderRadius: 12,
            background: '#ffffff', color: '#000000',
            boxShadow: '0 4px 24px rgba(255,255,255,0.12)',
          }}
        >
          <Play size={16} fill="white" />
          Start {durationMin}-minute session
        </button>

      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DEEP FOCUS OVERLAY  (running | paused | break | done)
  // ════════════════════════════════════════════════════════════════════════════
  const ringSize = isLandscape ? 210 : 270

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000000',
      display: 'flex',
      flexDirection: isLandscape ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isLandscape ? 52 : 28,
      padding: isLandscape ? '20px 40px' : '40px 24px',
      overflow: 'hidden',
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${ringColor}15 0%, transparent 70%)`,
        transition: 'background 600ms ease',
      }} />

      {/* Exit button */}
      <button onClick={reset} style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '6px 12px', color: 'var(--ink-4)',
        cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
        backdropFilter: 'blur(8px)',
      }}>
        <X size={12} /> Exit
      </button>

      {/* ── Ring ── */}
      <div style={{ position: 'relative', flexShrink: 0, width: ringSize, height: ringSize }}>
        <svg
          viewBox="0 0 220 220"
          width={ringSize}
          height={ringSize}
          style={{ display: 'block' }}
        >
          {/* Outer glow circle (decorative) */}
          <circle cx={CX} cy={CY} r={R + 12} fill="none"
            stroke={ringColor} strokeWidth={1} opacity={0.12} />

          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={9} />

          {/* Progress arc — depletes as time passes */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke={ringColor} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${CX}px ${CY}px`,
              transition: (phase === 'running' || phase === 'break')
                ? 'stroke-dashoffset 1s linear, stroke 600ms ease'
                : 'stroke 600ms ease',
              filter: `drop-shadow(0 0 10px ${ringColor}80)`,
            }}
          />
        </svg>

        {/* Timer text absolutely centered on ring */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4,
        }}>
          {phase === 'done' ? (
            <span style={{ fontSize: 48, lineHeight: 1 }}>🎉</span>
          ) : (
            <>
              <span style={{
                fontSize: isLandscape ? 44 : 54, fontWeight: 200,
                letterSpacing: '-0.04em', color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>
                {mm}:{ss}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: ringColor,
              }}>
                {phaseLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Info + Controls ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isLandscape ? 'flex-start' : 'center',
        textAlign: isLandscape ? 'left' : 'center',
        gap: 16,
        maxWidth: isLandscape ? 300 : 340, width: '100%',
        position: 'relative', zIndex: 1,
      }}>

        {/* Topic info (always visible) */}
        <div>
          <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.3 }}>
            {topic}
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '6px 0 0' }}>
            {catData?.icon} {category}
          </p>
        </div>

        {/* ── Running / Paused controls ── */}
        {(phase === 'running' || phase === 'paused') && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 260 }}>
            <button onClick={togglePause} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: ringColor, color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: `0 4px 20px ${ringColor}40`,
              transition: 'transform 120ms', letterSpacing: '-0.01em',
            }}
              onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'}
              onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
            >
              {phase === 'paused'
                ? <><Play size={15} fill="white" /> Resume</>
                : <><Pause size={15} /> Pause</>
              }
            </button>
            <button onClick={endEarly} style={{
              padding: '13px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              color: 'var(--ink-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, backdropFilter: 'blur(4px)',
            }}>
              <X size={14} /> End
            </button>
          </div>
        )}

        {/* ── Break controls ── */}
        {phase === 'break' && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 260 }}>
            <button onClick={togglePause} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 600,
            }}>
              <Pause size={15} /> Pause
            </button>
            <button onClick={reset} style={{
              padding: '13px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              color: 'var(--ink-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <RotateCcw size={14} /> Skip
            </button>
          </div>
        )}

        {/* ── Done state ── */}
        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                Session complete!
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                padding: '4px 12px', borderRadius: 9999,
                background: `${ringColor}20`, border: `1px solid ${ringColor}40`,
                fontSize: 12, fontWeight: 600, color: ringColor,
              }}>
                ⏱ {elapsedLabel} · {catData?.icon} {category}
              </div>
            </div>

            {/* Notes before logging */}
            {!saved && (
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notes? (optional — key takeaways, links…)"
                style={{
                  width: '100%', minHeight: 64, fontSize: 13, resize: 'none',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10, padding: '10px 12px', color: 'var(--ink)', outline: 'none',
                  backdropFilter: 'blur(4px)',
                }}
              />
            )}

            {saveErr && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{saveErr}</p>}

            {saved ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e',
                }}>
                  <Check size={14} /> Logged successfully!
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startBreak(5)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', borderRadius: 10,
                    background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
                    color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  }}>
                    <Coffee size={13} /> 5m break
                  </button>
                  <button onClick={reset} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', borderRadius: 10,
                    background: ringColor, border: 'none',
                    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>
                    New session
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={logSession} disabled={saving} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: ringColor, color: '#fff', fontSize: 14, fontWeight: 600,
                  boxShadow: `0 4px 20px ${ringColor}40`,
                  opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? 'Saving…' : <><Check size={15} /> Log Session</>}
                </button>
                <button onClick={() => startBreak(5)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '13px', borderRadius: 12,
                  background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
                  color: '#22c55e', cursor: 'pointer',
                }}>
                  <Coffee size={14} />
                </button>
                <button onClick={reset} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '13px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--ink-4)', cursor: 'pointer',
                }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
