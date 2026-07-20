import type { TargetVersion, Weekday } from '../types';
import { WEEKDAY_LABELS } from './date';

export function describeTarget(target: TargetVersion | undefined): string {
  if (!target) return '';
  const v = target.value;
  switch (v.type) {
    case 'weekly_count':
      return v.floor !== undefined ? `${v.count}/week · floor ${v.floor}` : `${v.count}/week`;
    case 'daily_time': {
      const overrideCount = v.overrides ? Object.keys(v.overrides).length : 0;
      return overrideCount > 0 ? `${v.time}*` : v.time;
    }
    case 'daily_duration':
      return `${v.minutes} min`;
    case 'daily_binary':
      return 'done / not done';
    case 'weekly_duration':
      return `${v.minutes} min/week`;
    case 'inverted_binary':
      return 'zero';
    default:
      return '';
  }
}

export function describeSchedule(schedule: Weekday[]): string {
  if (schedule.length === 7) return 'Daily';
  const sorted = [...schedule].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAY_LABELS[d]).join(', ');
}
