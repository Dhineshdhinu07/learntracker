'use client'

import { LogEntry, CATEGORIES } from '@/lib/supabase'
import { deleteLogEntry } from '@/lib/db'
import { useState } from 'react'
import { Trash2, Clock } from 'lucide-react'

interface Props {
  entry: LogEntry
  onDeleted: () => void
  showDate?: boolean
}

// Notion-style tint backgrounds adapted for dark mode
const TINT_MAP: Record<string, { bg: string; text: string; border: string }> = {
  'DSA':           { bg: 'rgba(99,102,241,0.10)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)'  },
  'Java':          { bg: 'rgba(245,158,11,0.10)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
  'System Design': { bg: 'rgba(16,185,129,0.10)',  text: '#34d399', border: 'rgba(16,185,129,0.25)'  },
  'AI Engineering':{ bg: 'rgba(139,92,246,0.10)',  text: '#c084fc', border: 'rgba(139,92,246,0.25)'  },
  'Other':         { bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', border: 'rgba(107,114,128,0.20)' },
}

export default function SessionCard({ entry, onDeleted, showDate }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const cat  = CATEGORIES.find(c => c.value === entry.category)
  const tint = TINT_MAP[entry.category] ?? TINT_MAP['Other']

  const h   = Math.floor(entry.duration_minutes / 60)
  const m   = entry.duration_minutes % 60
  const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`

  async function handleDelete() {
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
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        background: hovered ? 'var(--surface-2)' : 'var(--surface-1)',
        border: '1px solid var(--line)',
        transition: 'background 150ms',
        alignItems: 'flex-start',
      }}
    >
      {/* Left accent bar (Linear-style) */}
      <div
        style={{
          width: 3,
          minHeight: 36,
          borderRadius: 9999,
          background: cat?.color ?? '#6366f1',
          flexShrink: 0,
          marginTop: 2,
          opacity: 0.8,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: chip + time + duration + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
          {/* Notion-style tinted category chip */}
          <span
            className="chip"
            style={{
              background: tint.bg,
              color: tint.text,
              borderColor: tint.border,
              fontSize: 11,
            }}
          >
            {cat?.icon} {entry.category}
          </span>

          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            {entry.start_time} – {entry.end_time}
          </span>

          {showDate && (
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{entry.date}</span>
          )}

          {/* Push duration + delete to the right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: 'var(--ink-3)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Clock size={11} />
              {dur}
            </span>

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

        {/* Notes */}
        {entry.notes && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--ink-3)',
              marginTop: 4,
              margin: '4px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  )
}
