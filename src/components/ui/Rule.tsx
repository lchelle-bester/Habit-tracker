interface RuleProps {
  strong?: boolean
}

export function Rule({ strong = false }: RuleProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `1px solid ${strong ? 'var(--rule-strong)' : 'var(--rule)'}`,
        margin: 0,
        width: '100%',
      }}
    />
  )
}
