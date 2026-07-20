import { getVerseForDate } from '../../engine/verses'
import type { ISODate } from '../../engine/types'

export function VerseCard({ date }: { date: ISODate }) {
  const verse = getVerseForDate(date)
  return (
    <figure className="verse-card">
      <blockquote>{verse.text}</blockquote>
      <figcaption>{verse.reference}</figcaption>
    </figure>
  )
}
