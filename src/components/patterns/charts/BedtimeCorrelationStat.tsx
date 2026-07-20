import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { today as todayFn } from '../../../engine/dates'
import { correlationOnTargetVsLate } from '../../../engine/selectors'
import type { AppData } from '../../../engine/types'

const MIN_SAMPLE = 3

export function BedtimeCorrelationStat() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const settings = useAppStore((s) => s.settings)
  const meta = useAppStore((s) => s.meta)
  const todayDate = todayFn()

  const result = useMemo(() => {
    const appData: AppData = { schemaVersion: 1, goals, entries, settings, meta }
    return correlationOnTargetVsLate(appData, todayDate)
  }, [goals, entries, settings, meta, todayDate])

  const enough = result.sampleSize.onTarget >= MIN_SAMPLE && result.sampleSize.late >= MIN_SAMPLE

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">Does bedtime actually predict the next day here?</div>
      {enough ? (
        <div className="correlation-stat">
          <div>
            <div className="correlation-stat__number tabular">{Math.round(result.onTargetRate * 100)}%</div>
            <div className="correlation-stat__label">
              next-day completion after on-target nights ({result.sampleSize.onTarget})
            </div>
          </div>
          <div>
            <div className="correlation-stat__number tabular">{Math.round(result.lateRate * 100)}%</div>
            <div className="correlation-stat__label">after late nights ({result.sampleSize.late})</div>
          </div>
        </div>
      ) : (
        <p className="pattern-section__empty">Not enough logged nights of both kinds yet to compare.</p>
      )}
    </div>
  )
}
