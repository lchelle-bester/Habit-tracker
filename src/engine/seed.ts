import type { AppData, Goal, ISODate } from './types'

function uuid(): string {
  return crypto.randomUUID()
}

/** The 6 goals the app ships with, each carrying its first target version effective from `installDate`. */
export function buildSeedGoals(installDate: ISODate): Goal[] {
  return [
    {
      id: uuid(),
      name: 'Boxing',
      type: 'weekly_count',
      schedule: [1, 2, 3, 5], // Mon, Tue, Wed, Fri
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [{ id: uuid(), effectiveFrom: installDate, target: 4, floor: 3 }],
    },
    {
      id: uuid(),
      name: 'Sleep',
      type: 'daily_time',
      schedule: [0, 1, 2, 3, 4, 5, 6],
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [
        { id: uuid(), effectiveFrom: installDate, defaultTime: '23:00', overrides: { 4: '22:30' } },
      ],
    },
    {
      id: uuid(),
      name: 'Scripture',
      type: 'daily_duration',
      schedule: [0, 1, 2, 3, 4, 5, 6],
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [{ id: uuid(), effectiveFrom: installDate, targetMinutes: 15 }],
    },
    {
      id: uuid(),
      name: 'Journal',
      type: 'daily_binary',
      schedule: [0, 1, 2, 3, 4, 5, 6],
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [{ id: uuid(), effectiveFrom: installDate }],
    },
    {
      id: uuid(),
      name: 'Reading',
      type: 'weekly_duration',
      schedule: [0], // Sunday
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [{ id: uuid(), effectiveFrom: installDate, targetMinutes: 30 }],
    },
    {
      id: uuid(),
      name: 'No scrolling',
      type: 'inverted_binary',
      schedule: [0, 1, 2, 3, 4, 5, 6],
      activeFrom: installDate,
      activeTo: null,
      archived: false,
      targetVersions: [{ id: uuid(), effectiveFrom: installDate }],
    },
  ]
}

export function buildSeedAppData(installDate: ISODate, schemaVersion: number): AppData {
  return {
    schemaVersion,
    goals: buildSeedGoals(installDate),
    entries: [],
    settings: { theme: 'system' },
    meta: { installedAt: installDate },
  }
}
