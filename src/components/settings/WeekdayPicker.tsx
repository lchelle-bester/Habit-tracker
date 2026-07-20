import type { Weekday } from '../../engine/types'

const DAYS: { value: Weekday; label: string }[] = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
]

export function WeekdayPicker({ value, onChange }: { value: Weekday[]; onChange: (schedule: Weekday[]) => void }) {
  const toggle = (day: Weekday) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort())
  }

  return (
    <div className="weekday-picker">
      {DAYS.map((d) => (
        <button
          key={d.value}
          type="button"
          className={`weekday-picker__day${value.includes(d.value) ? ' weekday-picker__day--on' : ''}`}
          onClick={() => toggle(d.value)}
          aria-pressed={value.includes(d.value)}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}
