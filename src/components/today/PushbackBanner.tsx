import type { PushbackFlag } from '../../engine/types'

export function PushbackBanner({ flag }: { flag: PushbackFlag | null }) {
  if (!flag) return null
  return (
    <div className="pushback-banner">
      <p>{flag.message}</p>
    </div>
  )
}
