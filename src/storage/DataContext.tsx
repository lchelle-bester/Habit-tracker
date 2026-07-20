import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Goal, LogEntry, TargetValue } from '../types';
import { loadData, saveData, upsertLog, createGoal, updateGoalTarget, archiveGoal, reactivateGoal, exportJSON, parseImportedJSON } from './store';

interface DataContextValue {
  goals: Goal[];
  logs: LogEntry[];
  setLog: (goalId: string, date: string, patch: Partial<LogEntry>) => void;
  addGoal: (input: { name: string; type: Goal['type']; schedule: Goal['schedule']; value: TargetValue }) => void;
  editGoalTarget: (goalId: string, value: TargetValue, effectiveFrom?: string) => void;
  editGoalMeta: (goalId: string, patch: Partial<Pick<Goal, 'name' | 'schedule'>>) => void;
  archive: (goalId: string) => void;
  reactivate: (goalId: string) => void;
  doExport: () => void;
  doImport: (text: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const value = useMemo<DataContextValue>(
    () => ({
      goals: data.goals,
      logs: data.logs,
      setLog: (goalId, date, patch) => {
        setData((prev) => ({ ...prev, logs: upsertLog(prev.logs, goalId, date, patch) }));
      },
      addGoal: (input) => {
        setData((prev) => ({ ...prev, goals: [...prev.goals, createGoal(input)] }));
      },
      editGoalTarget: (goalId, value, effectiveFrom) => {
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === goalId ? updateGoalTarget(g, value, effectiveFrom) : g)),
        }));
      },
      editGoalMeta: (goalId, patch) => {
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
        }));
      },
      archive: (goalId) => {
        setData((prev) => ({ ...prev, goals: prev.goals.map((g) => (g.id === goalId ? archiveGoal(g) : g)) }));
      },
      reactivate: (goalId) => {
        setData((prev) => ({ ...prev, goals: prev.goals.map((g) => (g.id === goalId ? reactivateGoal(g) : g)) }));
      },
      doExport: () => exportJSON(data),
      doImport: (text) => {
        const imported = parseImportedJSON(text);
        setData(imported);
      },
    }),
    [data]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
