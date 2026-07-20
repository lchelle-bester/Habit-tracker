import { create } from 'zustand'
import { addOrReplaceTargetVersion } from '../engine/targetResolution'
import { flushPendingWrite, loadAppData, persistAppData } from '../storage/storage'
import type { AppData, Entry, Goal, GoalTypeId, TargetVersionMap } from '../engine/types'

interface AppStore {
  goals: Goal[]
  entries: Entry[]
  settings: AppData['settings']
  meta: AppData['meta']

  addGoal: (goal: Goal) => void
  editGoalTargetVersion: <K extends GoalTypeId>(goalId: string, newVersion: TargetVersionMap[K]) => void
  renameGoal: (goalId: string, name: string) => void
  updateSchedule: (goalId: string, schedule: Goal['schedule']) => void
  archiveGoal: (goalId: string) => void
  reactivateGoal: (goalId: string) => void
  deleteGoal: (goalId: string) => void
  upsertEntry: (entry: Entry) => void
  importAppData: (data: AppData) => void
  setTheme: (theme: AppData['settings']['theme']) => void
}

function snapshotOf(state: AppStore): AppData {
  return {
    schemaVersion: 1,
    goals: state.goals,
    entries: state.entries,
    settings: state.settings,
    meta: state.meta,
  }
}

const initial = loadAppData()

export const useAppStore = create<AppStore>((set, get) => {
  function persist() {
    persistAppData(snapshotOf(get()))
  }

  return {
    goals: initial.goals,
    entries: initial.entries,
    settings: initial.settings,
    meta: initial.meta,

    addGoal: (goal) => {
      set((state) => ({ goals: [...state.goals, goal] }))
      persist()
    },

    editGoalTargetVersion: (goalId, newVersion) => {
      set((state) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        goals: state.goals.map((g) => (g.id === goalId ? (addOrReplaceTargetVersion(g as any, newVersion as any) as Goal) : g)),
      }))
      persist()
    },

    renameGoal: (goalId, name) => {
      set((state) => ({ goals: state.goals.map((g) => (g.id === goalId ? { ...g, name } : g)) }))
      persist()
    },

    updateSchedule: (goalId, schedule) => {
      set((state) => ({ goals: state.goals.map((g) => (g.id === goalId ? { ...g, schedule } : g)) }))
      persist()
    },

    archiveGoal: (goalId) => {
      set((state) => ({ goals: state.goals.map((g) => (g.id === goalId ? { ...g, archived: true } : g)) }))
      persist()
    },

    reactivateGoal: (goalId) => {
      set((state) => ({ goals: state.goals.map((g) => (g.id === goalId ? { ...g, archived: false } : g)) }))
      persist()
    },

    deleteGoal: (goalId) => {
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        entries: state.entries.filter((e) => e.goalId !== goalId),
      }))
      persist()
    },

    upsertEntry: (entry) => {
      set((state) => {
        const withoutExisting = state.entries.filter((e) => !(e.goalId === entry.goalId && e.date === entry.date))
        return { entries: [...withoutExisting, entry] }
      })
      persist()
    },

    importAppData: (data) => {
      set({ goals: data.goals, entries: data.entries, settings: data.settings, meta: data.meta })
      persist()
    },

    setTheme: (theme) => {
      set((state) => ({ settings: { ...state.settings, theme } }))
      persist()
    },
  }
})

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingWrite()
  })
}
