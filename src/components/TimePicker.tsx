'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  value: string           // 'HH:mm'
  onChange: (val: string) => void
}

// Every 15-min slot across 24h
const TIME_OPTIONS: { value: string; label: string }[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    const period = h < 12 ? 'AM' : 'PM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    TIME_OPTIONS.push({
      value: `${hh}:${mm}`,
      label: `${h12}:${mm} ${period}`,
    })
  }
}

export default function TimePicker({ value, onChange }: Props) {
  // base-ui Select.Root uses onValueChange(value: string | null, eventDetails)
  // We guard against null and only call onChange with a real string
  const handleChange = (val: string | null) => {
    if (val) onChange(val)
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        className="w-full"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid oklch(1 0 0 / 10%)',
          color: 'var(--text)',
          borderRadius: 10,
          padding: '0 14px',
          fontSize: 14,
          height: 42,
          width: '100%',
        }}
      >
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent
        style={{
          background: 'var(--surface)',
          border: '1px solid oklch(1 0 0 / 10%)',
        }}
      >
        {TIME_OPTIONS.map(opt => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            style={{ color: 'var(--text)', fontSize: 13 }}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
