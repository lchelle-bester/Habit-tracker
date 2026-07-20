import type { Goal } from '../types/goal';

function uid(): string {
  return crypto.randomUUID();
}

export function seedGoals(todayISO: string): Goal[] {
  const mk = (
    name: string,
    type: Goal['type'],
    schedule: number[],
    config: Goal['versions'][number]['config'],
  ): Goal => {
    const goalId = uid();
    return {
      id: goalId,
      name,
      type,
      activeFrom: todayISO,
      activeTo: null,
      archived: false,
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: uid(),
          goalId,
          effectiveFrom: todayISO,
          schedule: schedule as Goal['versions'][number]['schedule'],
          config,
        },
      ],
    };
  };

  return [
    mk('Boxing', 'weekly_count', [1, 2, 3, 5], { kind: 'weekly_count', target: 4, floor: 3 }),
    mk('Sleep', 'daily_time', [1, 2, 3, 4, 5, 6, 7], {
      kind: 'daily_time',
      time: '23:00',
      overrides: { 4: '22:30' },
    }),
    mk('Scripture', 'daily_duration', [1, 2, 3, 4, 5, 6, 7], { kind: 'daily_duration', minutes: 15 }),
    mk('Journal', 'daily_binary', [1, 2, 3, 4, 5, 6, 7], { kind: 'daily_binary', label: '1 page' }),
    mk('Reading', 'weekly_duration', [7], { kind: 'weekly_duration', minutes: 30 }),
    mk('No scrolling', 'inverted_binary', [1, 2, 3, 4, 5, 6, 7], { kind: 'inverted_binary' }),
  ];
}
