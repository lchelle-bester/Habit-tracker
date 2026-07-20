import { useState } from 'react';
import type { Goal, GoalType, TargetValue, Weekday } from '../../types';
import { useData } from '../../storage/DataContext';
import { currentTarget } from '../../engine/targets';
import { todayISO, WEEKDAY_LABELS } from '../../engine/date';
import './Settings.css';

const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const TYPE_LABELS: Record<GoalType, string> = {
  weekly_count: 'Weekly count — N times per week',
  daily_time: 'Daily time — target clock time',
  daily_duration: 'Daily duration — target minutes',
  daily_binary: 'Daily binary — done / not done',
  weekly_duration: 'Weekly duration — minutes on given day(s)',
  inverted_binary: 'Inverted binary — success is absence',
};

function defaultValueForType(type: GoalType): TargetValue {
  switch (type) {
    case 'weekly_count':
      return { type, count: 3 };
    case 'daily_time':
      return { type, time: '23:00' };
    case 'daily_duration':
      return { type, minutes: 15 };
    case 'weekly_duration':
      return { type, minutes: 30 };
    case 'daily_binary':
      return { type };
    case 'inverted_binary':
      return { type };
  }
}

export function GoalForm({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { addGoal, editGoalMeta, editGoalTarget } = useData();
  const isEdit = !!goal;
  const existingTarget = goal ? currentTarget(goal) : undefined;

  const [name, setName] = useState(goal?.name ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'daily_binary');
  const [schedule, setSchedule] = useState<Weekday[]>(goal?.schedule ?? [0, 1, 2, 3, 4, 5, 6]);
  const [value, setValue] = useState<TargetValue>(existingTarget?.value ?? defaultValueForType(type));
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());

  const toggleDay = (d: Weekday) => {
    setSchedule((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEdit && goal) {
      editGoalMeta(goal.id, { name: name.trim(), schedule });
      const targetChanged = JSON.stringify(value) !== JSON.stringify(existingTarget?.value);
      if (targetChanged) editGoalTarget(goal.id, value, effectiveFrom);
    } else {
      addGoal({ name: name.trim(), type, schedule, value });
    }
    onClose();
  };

  return (
    <div className="goal-form">
      <div className="form-field">
        <label className="label">Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" />
      </div>

      <div className="form-field">
        <label className="label">Type</label>
        {isEdit ? (
          <p className="form-static">{TYPE_LABELS[type]}</p>
        ) : (
          <select
            className="form-input"
            value={type}
            onChange={(e) => {
              const t = e.target.value as GoalType;
              setType(t);
              setValue(defaultValueForType(t));
            }}
          >
            {(Object.keys(TYPE_LABELS) as GoalType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-field">
        <label className="label">Schedule</label>
        <div className="weekday-picker">
          {ALL_WEEKDAYS.map((d) => (
            <button
              key={d}
              type="button"
              className={schedule.includes(d) ? 'weekday-chip weekday-chip-on' : 'weekday-chip'}
              onClick={() => toggleDay(d)}
            >
              {WEEKDAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <TargetFields type={type} value={value} onChange={setValue} schedule={schedule} />

      {isEdit && (
        <div className="form-field">
          <label className="label">Effective from</label>
          <input
            className="form-input"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
          <p className="form-hint">Changes to the target apply from this date forward. Earlier days keep evaluating against the old target.</p>
        </div>
      )}

      <div className="form-actions">
        <button className="control-toggle" onClick={handleSave}>
          {isEdit ? 'Save changes' : 'Create goal'}
        </button>
        <button className="control-text" onClick={onClose}>
          cancel
        </button>
      </div>
    </div>
  );
}

function TargetFields({
  type,
  value,
  onChange,
  schedule,
}: {
  type: GoalType;
  value: TargetValue;
  onChange: (v: TargetValue) => void;
  schedule: Weekday[];
}) {
  if (type === 'weekly_count' && value.type === 'weekly_count') {
    return (
      <>
        <div className="form-field">
          <label className="label">Target per week</label>
          <input
            className="form-input form-input-narrow"
            type="number"
            value={value.count}
            onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
          />
        </div>
        <div className="form-field">
          <label className="label">Floor (optional — still counts as a pass)</label>
          <input
            className="form-input form-input-narrow"
            type="number"
            value={value.floor ?? ''}
            onChange={(e) => onChange({ ...value, floor: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </div>
      </>
    );
  }

  if (type === 'daily_time' && value.type === 'daily_time') {
    return (
      <>
        <div className="form-field">
          <label className="label">Target time</label>
          <input className="form-input form-input-narrow" type="time" value={value.time} onChange={(e) => onChange({ ...value, time: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">Per-weekday overrides (optional)</label>
          {schedule.map((d) => (
            <div className="override-row" key={d}>
              <span className="override-day">{WEEKDAY_LABELS[d]}</span>
              <input
                className="form-input form-input-narrow"
                type="time"
                value={value.overrides?.[d] ?? ''}
                onChange={(e) => {
                  const overrides = { ...value.overrides };
                  if (e.target.value) overrides[d] = e.target.value;
                  else delete overrides[d];
                  onChange({ ...value, overrides });
                }}
              />
            </div>
          ))}
        </div>
      </>
    );
  }

  if ((type === 'daily_duration' || type === 'weekly_duration') && (value.type === 'daily_duration' || value.type === 'weekly_duration')) {
    return (
      <div className="form-field">
        <label className="label">Target minutes</label>
        <input
          className="form-input form-input-narrow"
          type="number"
          value={value.minutes}
          onChange={(e) => onChange({ ...value, minutes: Number(e.target.value) })}
        />
      </div>
    );
  }

  return null;
}
