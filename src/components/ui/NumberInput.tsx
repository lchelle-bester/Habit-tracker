interface NumberInputProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  suffix?: string
}

export function NumberInput({ label, value, onChange, suffix }: NumberInputProps) {
  return (
    <div className="ui-field">
      <label>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </label>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  )
}
