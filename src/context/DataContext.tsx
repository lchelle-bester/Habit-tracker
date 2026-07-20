import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Goal, GoalVersion, LogEntry, LogValue } from '../types/goal';
import { loadData, saveData, exportJSON, importJSON } from '../data/storage';

interface DataContextValue {
  goals: Goal[];
  logs: LogEntry[];
  setLog: (goalId: string, date: string, value: LogValue) => void;
  clearLog: (goalId: string, date: string) => void;
  addGoal: (goal: Goal) => void;
  updateGoalMeta: (goalId: string, patch: Partial<Pick<Goal, 'name' | 'activeFrom' | 'activeTo'>>) => void;
  addGoalVersion: (goalId: string, version: Omit<GoalVersion, 'id' | 'goalId'>) => void;
  archiveGoal: (goalId: string, archived: boolean, todayISO: string) => void;
  exportData: () => void;
  importData: (json: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setLog = useCallback((goalId: string, date: string, value: LogValue) => {
    setData((prev) => {
      const existing = prev.logs.find((l) => l.goalId === goalId && l.date === date);
      if (existing) {
        return {
          ...prev,
          logs: prev.logs.map((l) => (l.id === existing.id ? { ...l, value } : l)),
        };
      }
      const entry: LogEntry = { id: crypto.randomUUID(), goalId, date, value, createdAt: new Date().toISOString() };
      return { ...prev, logs: [...prev.logs, entry] };
    });
  }, []);

  const clearLog = useCallback((goalId: string, date: string) => {
    setData((prev) => ({ ...prev, logs: prev.logs.filter((l) => !(l.goalId === goalId && l.date === date)) }));
  }, []);

  const addGoal = useCallback((goal: Goal) => {
    setData((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }, []);

  const updateGoalMeta = useCallback((goalId: string, patch: Partial<Pick<Goal, 'name' | 'activeFrom' | 'activeTo'>>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
    }));
  }, []);

  const addGoalVersion = useCallback((goalId: string, version: Omit<GoalVersion, 'id' | 'goalId'>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const withoutSameDate = g.versions.filter((v) => v.effectiveFrom !== version.effectiveFrom);
        const next = [...withoutSameDate, { ...version, id: crypto.randomUUID(), goalId }].sort((a, b) =>
          a.effectiveFrom.localeCompare(b.effectiveFrom),
        );
        return { ...g, versions: next };
      }),
    }));
  }, []);

  const archiveGoal = useCallback((goalId: string, archived: boolean, todayISO: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        if (archived) return { ...g, archived: true, activeTo: g.activeTo ?? todayISO };
        return { ...g, archived: false, activeTo: null };
      }),
    }));
  }, []);

  const exportData = useCallback(() => exportJSON(data), [data]);
  const importData = useCallback((json: string) => setData(importJSON(json)), []);

  const value = useMemo<DataContextValue>(
    () => ({ goals: data.goals, logs: data.logs, setLog, clearLog, addGoal, updateGoalMeta, addGoalVersion, archiveGoal, exportData, importData }),
    [data, setLog, clearLog, addGoal, updateGoalMeta, addGoalVersion, archiveGoal, exportData, importData],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
