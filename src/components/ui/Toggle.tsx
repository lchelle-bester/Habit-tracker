interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Editorial substitute for a checkbox/switch: a small filling ring plus a label that states its own status in words. */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button type="button" className={`ui-toggle${checked ? ' ui-toggle--on' : ''}`} aria-pressed={checked} onClick={() => onChange(!checked)}>
      <span className="ui-toggle-ring" />
      <span className="ui-toggle-label">{label}</span>
    </button>
  )
}
