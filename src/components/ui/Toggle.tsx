interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Editorial substitute for a checkbox/switch: a tap target that states its own status in words, not a colored pill. */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className="ui-toggle"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      style={{ opacity: checked ? 1 : 0.55, fontWeight: checked ? 600 : 400 }}
    >
      <span className="ui-toggle-mark">{checked ? '—' : '·'}</span>
      <span>{label}</span>
    </button>
  )
}
