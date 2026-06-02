'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface Props {
  value: string           // 'yyyy-MM-dd'
  onChange: (val: string) => void
  maxDate?: Date
}

export default function DatePicker({ value, onChange, maxDate }: Props) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* base-ui Trigger renders as <button> — style it directly, no asChild needed */}
      <PopoverTrigger
        className="w-full flex items-center gap-2 px-3 rounded-xl text-sm text-left transition-colors"
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${open ? 'var(--accent-app)' : 'oklch(1 0 0 / 10%)'}`,
          color: value ? 'var(--text)' : 'var(--text-muted)',
          boxShadow: open ? '0 0 0 3px var(--accent-glow)' : 'none',
          height: 42,
          outline: 'none',
        }}
      >
        <CalendarIcon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span>{value ? format(parseISO(value), 'EEE, MMM d yyyy') : 'Pick a date'}</span>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        style={{ background: 'var(--surface)', border: '1px solid oklch(1 0 0 / 10%)', zIndex: 9999 }}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={d => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
          disabled={maxDate ? { after: maxDate } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
