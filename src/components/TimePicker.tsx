'use client'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface Props {
  value: string           // 'HH:mm' stored value
  onChange: (val: string) => void
}

// Every 15-min slot across 24h — value is HH:MM, label is 12hr display
const TIME_OPTIONS: { value: string; label: string }[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh     = h.toString().padStart(2, '0')
    const mm     = m.toString().padStart(2, '0')
    const period = h < 12 ? 'AM' : 'PM'
    const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h
    TIME_OPTIONS.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${period}` })
  }
}

export default function TimePicker({ value, onChange }: Props) {
  const handleChange = (val: string | null) => { if (val) onChange(val) }

  // @base-ui/react Select.Value renders the raw value string, not the item label.
  // Look up the 12hr label explicitly and render it ourselves in the trigger.
  const displayLabel = TIME_OPTIONS.find(o => o.value === value)?.label

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        className="w-full"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line-strong)',
          color: 'var(--ink)',
          borderRadius: 10,
          padding: '0 14px',
          fontSize: 14,
          height: 42,
          width: '100%',
        }}
      >
        {/* Render the 12hr label directly — bypasses SelectValue's raw-value fallback */}
        <span style={{ flex: 1, textAlign: 'left', color: displayLabel ? 'var(--ink)' : 'var(--ink-4)', fontSize: 14 }}>
          {displayLabel ?? 'Select time'}
        </span>
      </SelectTrigger>

      {/* ── Dropdown ──
          bg-popover (Tailwind) = var(--popover) = var(--surface-4) = #21222b
          The explicit style overrides that with the same solid dark value + shadow.
          Previously var(--surface) was undefined → transparent. Fixed. */}
      <SelectContent
        sideOffset={4}
        style={{
          background: 'var(--surface-4)',
          border: '1px solid var(--line-strong)',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          padding: '4px',
        }}
      >
        {TIME_OPTIONS.map(opt => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            style={{ fontSize: 13, color: 'var(--ink-2)', borderRadius: 6 }}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
