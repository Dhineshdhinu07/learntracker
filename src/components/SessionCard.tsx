'use client'

import { LogEntry, CATEGORIES } from '@/lib/supabase'
import { deleteLogEntry } from '@/lib/db'
import { useState } from 'react'
import { Trash2, Clock, ChevronDown, ExternalLink } from 'lucide-react'

interface Props {
  entry: LogEntry
  onDeleted: () => void
  showDate?: boolean
}

// Notion-style tint backgrounds adapted for dark mode
const TINT_MAP: Record<string, { bg: string; text: string; border: string }> = {
  'DSA':                  { bg: 'rgba(99,102,241,0.10)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)'  },
  'Python':               { bg: 'rgba(14,165,233,0.10)',  text: '#38bdf8', border: 'rgba(14,165,233,0.25)'  },
  'System Design':        { bg: 'rgba(16,185,129,0.10)',  text: '#34d399', border: 'rgba(16,185,129,0.25)'  },
  'Computer Fundamentals':{ bg: 'rgba(245,158,11,0.10)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
  'Frontend':             { bg: 'rgba(236,72,153,0.10)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)'  },
  'Backend':              { bg: 'rgba(139,92,246,0.10)',  text: '#c084fc', border: 'rgba(139,92,246,0.25)'  },
  'Other':                { bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', border: 'rgba(107,114,128,0.20)' },
}

// Convert HH:MM (24hr) → h:MM AM/PM
function to12hr(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// Split notes text and make URLs into clickable links
function renderNotes(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{
          color: '#818cf8',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(129,140,248,0.4)',
          textUnderlineOffset: '2px',
          wordBreak: 'break-all',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {part.length > 55 ? part.slice(0, 55) + '…' : part}
        <ExternalLink size={10} style={{ flexShrink: 0, marginLeft: 1 }} />
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function SessionCard({ entry, onDeleted, showDate }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const cat  = CATEGORIES.find(c => c.value === entry.category)
  const tint = TINT_MAP[entry.category] ?? TINT_MAP['Other']

  const h   = Math.floor(entry.duration_minutes / 60)
  const m   = entry.duration_minutes % 60
  const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this session?')) return
    setDeleting(true)
    await deleteLogEntry(entry.id)
    onDeleted()
  }

  return (
    <div
      className="animate-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setExpanded(x => !x)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        background: expanded || hovered ? 'var(--surface-2)' : 'var(--surface-1)',
        border: `1px solid ${expanded ? 'var(--line-strong)' : 'var(--line)'}`,
        transition: 'background 150ms, border-color 150ms',
        alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      {/* Left accent bar (Linear-style) */}
      <div style={{
        width: 3,
        minHeight: 36,
        borderRadius: 9999,
        background: cat?.color ?? '#6366f1',
        flexShrink: 0,
        marginTop: 2,
        opacity: 0.8,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Top row: chip + time + duration + chevron + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
          <span className="chip" style={{ background: tint.bg, color: tint.text, borderColor: tint.border, fontSize: 11 }}>
            {cat?.icon} {entry.category}
          </span>

          {/* 12-hour time format */}
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            {to12hr(entry.start_time)} – {to12hr(entry.end_time)}
          </span>

          {showDate && (
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{entry.date}</span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
              <Clock size={11} />
              {dur}
            </span>

            {/* Expand chevron */}
            <ChevronDown
              size={13}
              style={{
                color: 'var(--ink-4)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
                flexShrink: 0,
              }}
            />

            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity 150ms',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                color: '#ef4444',
                display: 'flex',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Topic */}
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>
          {entry.topic}
        </p>

        {/* Notes — clamped (collapsed) */}
        {entry.notes && !expanded && (
          <p style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            margin: '4px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {entry.notes}
          </p>
        )}

        {/* ── Expanded preview panel ── */}
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>

            {/* Time breakdown */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: entry.notes ? 12 : 0 }}>
              {[
                { label: 'Start',    val: to12hr(entry.start_time) },
                { label: 'End',      val: to12hr(entry.end_time) },
                { label: 'Duration', val: dur },
                ...(showDate ? [{ label: 'Date', val: entry.date }] : []),
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="eyebrow" style={{ marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Full notes with clickable links */}
            {entry.notes && (
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65 }}>
                  {renderNotes(entry.notes)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
