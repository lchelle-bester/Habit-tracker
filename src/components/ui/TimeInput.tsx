interface TimeInputProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
}

export function TimeInput({ label, value, onChange }: TimeInputProps) {
  return (
    <div className="ui-field">
      <label>{label}</label>
      <input type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
    </div>
  )
}
