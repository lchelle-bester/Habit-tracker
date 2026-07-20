import { GoalRowBinary } from './GoalRowBinary'
import { GoalRowDuration } from './GoalRowDuration'
import { GoalRowInvertedBinary } from './GoalRowInvertedBinary'
import { GoalRowTime } from './GoalRowTime'
import { GoalRowWeeklyCount } from './GoalRowWeeklyCount'
import { GoalRowWeeklyDuration } from './GoalRowWeeklyDuration'
import type { Entry, Goal, ISODate } from '../../engine/types'

export function GoalRow({ goal, entry, date }: { goal: Goal; entry: Entry | undefined; date: ISODate }) {
  switch (goal.type) {
    case 'daily_binary':
      return <GoalRowBinary goal={goal} entry={entry} date={date} />
    case 'inverted_binary':
      return <GoalRowInvertedBinary goal={goal} entry={entry} date={date} />
    case 'daily_duration':
      return <GoalRowDuration goal={goal} entry={entry} date={date} />
    case 'daily_time':
      return <GoalRowTime goal={goal} entry={entry} date={date} />
    case 'weekly_count':
      return <GoalRowWeeklyCount goal={goal} entry={entry} date={date} />
    case 'weekly_duration':
      return <GoalRowWeeklyDuration goal={goal} entry={entry} date={date} />
  }
}
