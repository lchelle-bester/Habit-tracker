import type { Goal, Weekday } from '../types';
import { todayISO } from '../engine/date';

const MON_TUE_WED_FRI: Weekday[] = [1, 2, 3, 5];
const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const SUNDAY: Weekday[] = [0];

/** The six seed goals, versioned targets opening on the day the app is
 * first run. No history is fabricated — tracking starts from today. */
export function buildSeedGoals(): Goal[] {
  const from = todayISO();
  const mk = (partial: Omit<Goal, 'activeFrom' | 'activeTo' | 'archived' | 'createdAt'>): Goal => ({
    ...partial,
    activeFrom: from,
    activeTo: null,
    archived: false,
    createdAt: new Date().toISOString(),
  });

  return [
    mk({
      id: 'goal-boxing',
      name: 'Boxing',
      type: 'weekly_count',
      schedule: MON_TUE_WED_FRI,
      targets: [{ id: 'target-boxing-1', from, to: null, value: { type: 'weekly_count', count: 4, floor: 3 } }],
    }),
    mk({
      id: 'goal-sleep',
      name: 'Sleep',
      type: 'daily_time',
      schedule: DAILY,
      targets: [
        {
          id: 'target-sleep-1',
          from,
          to: null,
          value: { type: 'daily_time', time: '23:00', overrides: { 4: '22:30' } },
        },
      ],
    }),
    mk({
      id: 'goal-scripture',
      name: 'Scripture',
      type: 'daily_duration',
      schedule: DAILY,
      targets: [{ id: 'target-scripture-1', from, to: null, value: { type: 'daily_duration', minutes: 15 } }],
    }),
    mk({
      id: 'goal-journal',
      name: 'Journal',
      type: 'daily_binary',
      schedule: DAILY,
      targets: [{ id: 'target-journal-1', from, to: null, value: { type: 'daily_binary' } }],
    }),
    mk({
      id: 'goal-reading',
      name: 'Reading',
      type: 'weekly_duration',
      schedule: SUNDAY,
      targets: [{ id: 'target-reading-1', from, to: null, value: { type: 'weekly_duration', minutes: 30 } }],
    }),
    mk({
      id: 'goal-scrolling',
      name: 'No scrolling',
      type: 'inverted_binary',
      schedule: DAILY,
      targets: [{ id: 'target-scrolling-1', from, to: null, value: { type: 'inverted_binary' } }],
    }),
  ];
}
