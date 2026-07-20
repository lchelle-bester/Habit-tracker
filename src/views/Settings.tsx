import { useState, type ChangeEvent } from 'react';
import { useData } from '../context/DataContext';
import { today } from '../utils/date';
import { WEEKDAY_LABEL, WEEKDAYS } from '../types/goal';
import type { Goal, GoalType, TargetConfig, Weekday } from '../types/goal';
import { currentConfig, currentSchedule } from '../engine/goalEngine';

const TYPE_LABEL: Record<GoalType, string> = {
  weekly_count: 'Weekly count',
  daily_time: 'Daily time',
  daily_duration: 'Daily duration',
  daily_binary: 'Daily yes/no',
  weekly_duration: 'Weekly duration',
  inverted_binary: 'Negative (absence = success)',
};

function defaultConfig(type: GoalType): TargetConfig {
  switch (type) {
    case 'weekly_count':
      return { kind: 'weekly_count', target: 3, floor: 2 };
    case 'daily_time':
      return { kind: 'daily_time', time: '22:30' };
    case 'daily_duration':
      return { kind: 'daily_duration', minutes: 15 };
    case 'daily_binary':
      return { kind: 'daily_binary' };
    case 'weekly_duration':
      return { kind: 'weekly_duration', minutes: 30 };
    case 'inverted_binary':
      return { kind: 'inverted_binary' };
  }
}

function WeekdayPicker({ value, onChange }: { value: Weekday[]; onChange: (v: Weekday[]) => void }) {
  return (
    <div className="weekday-picker">
      {WEEKDAYS.map((wd) => (
        <button
          key={wd}
          type="button"
          className={value.includes(wd) ? 'on' : ''}
          onClick={() => (value.includes(wd) ? onChange(value.filter((w) => w !== wd)) : onChange([...value, wd].sort()))}
        >
          {WEEKDAY_LABEL[wd][0]}
        </button>
      ))}
    </div>
  );
}

function ConfigFields({ config, onChange }: { config: TargetConfig; onChange: (c: TargetConfig) => void }) {
  if (config.kind === 'weekly_count') {
    return (
      <>
        <label className="field">
          <span className="label-text">Target per week</span>
          <input type="number" min={0} value={config.target} onChange={(e) => onChange({ ...config, target: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span className="label-text">Floor (still counts as a pass)</span>
          <input type="number" min={0} value={config.floor} onChange={(e) => onChange({ ...config, floor: Number(e.target.value) })} />
        </label>
      </>
    );
  }
  if (config.kind === 'daily_time') {
    return (
      <label className="field">
        <span className="label-text">Target time</span>
        <input type="time" value={config.time} onChange={(e) => onChange({ ...config, time: e.target.value })} />
      </label>
    );
  }
  if (config.kind === 'daily_duration' || config.kind === 'weekly_duration') {
    return (
      <label className="field">
        <span className="label-text">Target minutes</span>
        <input type="number" min={0} value={config.minutes} onChange={(e) => onChange({ ...config, minutes: Number(e.target.value) })} />
      </label>
    );
  }
  if (config.kind === 'daily_binary') {
    return (
      <label className="field">
        <span className="label-text">Description (optional)</span>
        <input type="text" value={config.label ?? ''} onChange={(e) => onChange({ ...config, label: e.target.value })} />
      </label>
    );
  }
  return <p className="goal-sub">No target — success is absence. No streaks are tracked for this goal.</p>;
}

function NewGoalForm({ onDone }: { onDone: () => void }) {
  const { addGoal } = useData();
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('daily_binary');
  const [schedule, setSchedule] = useState<Weekday[]>([1, 2, 3, 4, 5, 6, 7]);
  const [config, setConfig] = useState<TargetConfig>(defaultConfig('daily_binary'));

  const changeType = (t: GoalType) => {
    setType(t);
    setConfig(defaultConfig(t));
  };

  const save = () => {
    if (!name.trim()) return;
    const goalId = crypto.randomUUID();
    const t = today();
    const goal: Goal = {
      id: goalId,
      name: name.trim(),
      type,
      activeFrom: t,
      activeTo: null,
      archived: false,
      createdAt: new Date().toISOString(),
      versions: [{ id: crypto.randomUUID(), goalId, effectiveFrom: t, schedule, config }],
    };
    addGoal(goal);
    onDone();
  };

  return (
    <div>
      <label className="field">
        <span className="label-text">Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="label-text">Type</span>
        <select value={type} onChange={(e) => changeType(e.target.value as GoalType)}>
          {(Object.keys(TYPE_LABEL) as GoalType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label-text">Schedule</span>
        <WeekdayPicker value={schedule} onChange={setSchedule} />
      </label>
      <ConfigFields config={config} onChange={setConfig} />
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
        <button className="btn-primary" onClick={save}>
          Create goal
        </button>
        <button className="btn-secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function GoalEditor({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const { updateGoalMeta, addGoalVersion, archiveGoal } = useData();
  const [name, setName] = useState(goal.name);
  const [schedule, setSchedule] = useState<Weekday[]>(currentSchedule(goal));
  const [config, setConfig] = useState<TargetConfig>(currentConfig(goal) ?? defaultConfig(goal.type));
  const [effectiveFrom, setEffectiveFrom] = useState(today());

  const hasChanges =
    JSON.stringify(schedule) !== JSON.stringify(currentSchedule(goal)) || JSON.stringify(config) !== JSON.stringify(currentConfig(goal));

  const saveName = () => {
    if (name.trim() && name.trim() !== goal.name) updateGoalMeta(goal.id, { name: name.trim() });
  };

  const saveVersion = () => {
    addGoalVersion(goal.id, { effectiveFrom, schedule, config });
  };

  return (
    <div>
      <label className="field">
        <span className="label-text">Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
      </label>

      <p className="goal-sub" style={{ marginBottom: 'var(--space-4)' }}>
        {TYPE_LABEL[goal.type]} · active since {goal.activeFrom}
        {goal.activeTo ? ` · ended ${goal.activeTo}` : ''}
      </p>

      <label className="field">
        <span className="label-text">Schedule</span>
        <WeekdayPicker value={schedule} onChange={setSchedule} />
      </label>
      <ConfigFields config={config} onChange={setConfig} />

      {hasChanges && (
        <label className="field">
          <span className="label-text">Effective from</span>
          <input type="date" value={effectiveFrom} min={goal.activeFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          <p className="goal-sub" style={{ marginTop: 'var(--space-2)' }}>
            Days before this date keep evaluating against the old target. History is never rewritten.
          </p>
        </label>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
        {hasChanges && (
          <button className="btn-primary" onClick={saveVersion}>
            Save new version
          </button>
        )}
        <button className="btn-secondary" onClick={onDone}>
          Close
        </button>
        {goal.archived ? (
          <button className="btn-text" onClick={() => archiveGoal(goal.id, false, today())}>
            Reactivate
          </button>
        ) : (
          <button className="btn-text" onClick={() => archiveGoal(goal.id, true, today())}>
            Archive
          </button>
        )}
      </div>

      {goal.versions.length > 1 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div className="section-label">History</div>
          {[...goal.versions].reverse().map((v) => (
            <div key={v.id} className="goal-sub" style={{ padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
              From {v.effectiveFrom} — {v.schedule.map((w) => WEEKDAY_LABEL[w]).join(', ')} — {describeConfig(v.config)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function describeConfig(c: TargetConfig): string {
  switch (c.kind) {
    case 'weekly_count':
      return `${c.target}/week, floor ${c.floor}`;
    case 'daily_time':
      return c.time;
    case 'daily_duration':
    case 'weekly_duration':
      return `${c.minutes} min`;
    case 'daily_binary':
      return c.label ?? 'done / not done';
    case 'inverted_binary':
      return 'zero tolerance';
  }
}

export function Settings() {
  const { goals, exportData, importData } = useData();
  const [selected, setSelected] = useState<string | 'new' | null>(null);

  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);

  const selectedGoal = typeof selected === 'string' && selected !== 'new' ? goals.find((g) => g.id === selected) : null;

  if (selected === 'new') {
    return (
      <div>
        <div className="section-label">New goal</div>
        <NewGoalForm onDone={() => setSelected(null)} />
      </div>
    );
  }

  if (selectedGoal) {
    return (
      <div>
        <button className="btn-text" onClick={() => setSelected(null)} style={{ marginBottom: 'var(--space-5)' }}>
          ← All goals
        </button>
        <GoalEditor goal={selectedGoal} onDone={() => setSelected(null)} />
      </div>
    );
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importData(text);
      e.target.value = '';
    });
  };

  return (
    <div>
      <div className="section-label">Active goals</div>
      {active.map((g) => (
        <div className="goal-row" key={g.id}>
          <div>
            <div className="goal-name">{g.name}</div>
            <div className="goal-sub">{TYPE_LABEL[g.type]}</div>
          </div>
          <button className="btn-text" onClick={() => setSelected(g.id)}>
            Edit
          </button>
        </div>
      ))}

      <button className="btn-primary" style={{ marginTop: 'var(--space-5)' }} onClick={() => setSelected('new')}>
        New goal
      </button>

      {archived.length > 0 && (
        <>
          <hr className="hairline" />
          <div className="section-label">Archived</div>
          {archived.map((g) => (
            <div className="goal-row" key={g.id}>
              <div>
                <div className="goal-name" style={{ opacity: 0.5 }}>
                  {g.name}
                </div>
                <div className="goal-sub">{TYPE_LABEL[g.type]}</div>
              </div>
              <button className="btn-text" onClick={() => setSelected(g.id)}>
                Edit
              </button>
            </div>
          ))}
        </>
      )}

      <hr className="hairline" />
      <div className="section-label">Data</div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={exportData}>
          Export JSON
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          Import JSON
          <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
