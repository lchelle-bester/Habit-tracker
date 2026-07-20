import { useState } from 'react';
import { useData } from '../context/DataContext';
import { today, timeDeltaMinutes } from '../utils/date';
import { evaluateWeek, isScheduledOn, logFor, targetTimeFor, versionForDate } from '../engine/goalEngine';
import { computeFlag } from '../engine/flags';
import { verseForDate } from '../data/verses';
import type { Goal } from '../types/goal';

function formatDelta(mins: number): string {
  if (mins === 0) return 'on time';
  const sign = mins > 0 ? '+' : '−';
  return `${sign}${Math.abs(mins)}m`;
}

function BoxingRow({ goal, todayISO }: { goal: Goal; todayISO: string }) {
  const { logs, setLog, clearLog } = useData();
  const week = evaluateWeek(goal, todayISO, logs, todayISO);
  const log = logFor(goal.id, todayISO, logs);
  const doneToday = log?.value.kind === 'weekly_count' && log.value.done;
  if (!week) return null;

  return (
    <div className="goal-row">
      <div>
        <div className="goal-name">{goal.name}</div>
        <div className="goal-sub">
          Target {week.target} · floor {week.floor}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="goal-state pass num" style={{ marginBottom: 6 }}>
          {week.count} / {week.target}
        </div>
        <button
          className={`tap${doneToday ? ' done' : ''}`}
          onClick={() => (doneToday ? clearLog(goal.id, todayISO) : setLog(goal.id, todayISO, { kind: 'weekly_count', done: true }))}
        >
          {doneToday ? 'Logged' : 'Log session'}
        </button>
      </div>
    </div>
  );
}

function SleepRow({ goal, todayISO }: { goal: Goal; todayISO: string }) {
  const { logs, setLog } = useData();
  const version = versionForDate(goal, todayISO);
  if (!version) return null;
  const target = targetTimeFor(version, todayISO);
  const log = logFor(goal.id, todayISO, logs);
  const actual = log?.value.kind === 'daily_time' ? log.value.actual : '';
  const delta = actual ? timeDeltaMinutes(target, actual) : null;

  return (
    <div className="goal-row">
      <div>
        <div className="goal-name">{goal.name}</div>
        <div className="goal-sub">Target {target}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {delta !== null && (
          <div className={`goal-state num ${delta <= 0 ? 'pass' : 'fail'}`} style={{ marginBottom: 6 }}>
            {formatDelta(delta)}
          </div>
        )}
        <input
          type="time"
          value={actual}
          onChange={(e) => e.target.value && setLog(goal.id, todayISO, { kind: 'daily_time', actual: e.target.value })}
          style={{ width: 110 }}
        />
      </div>
    </div>
  );
}

function DurationRow({ goal, todayISO, weekly }: { goal: Goal; todayISO: string; weekly: boolean }) {
  const { logs, setLog, clearLog } = useData();
  const [editing, setEditing] = useState(false);
  const version = versionForDate(goal, todayISO);
  if (!version || (version.config.kind !== 'daily_duration' && version.config.kind !== 'weekly_duration')) return null;
  const target = version.config.minutes;
  const log = logFor(goal.id, todayISO, logs);
  const minutes = log && (log.value.kind === 'daily_duration' || log.value.kind === 'weekly_duration') ? log.value.minutes : 0;
  const done = minutes >= target;
  const kind = weekly ? 'weekly_duration' : 'daily_duration';

  return (
    <div className="goal-row">
      <div>
        <div className="goal-name">{goal.name}</div>
        <div className="goal-sub">
          {weekly ? 'Weekly target' : 'Target'} {target} min
          {!editing && (
            <>
              {' · '}
              <button className="btn-text" onClick={() => setEditing(true)}>
                custom
              </button>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {editing ? (
          <input
            type="number"
            min={0}
            autoFocus
            defaultValue={minutes || ''}
            placeholder="min"
            style={{ width: 90 }}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0) setLog(goal.id, todayISO, { kind, minutes: v } as never);
              else clearLog(goal.id, todayISO);
              setEditing(false);
            }}
          />
        ) : (
          <>
            {minutes > 0 && (
              <div className="goal-state num" style={{ marginBottom: 6 }}>
                {minutes}m
              </div>
            )}
            <button
              className={`tap${done ? ' done' : ''}`}
              onClick={() => (done ? clearLog(goal.id, todayISO) : setLog(goal.id, todayISO, { kind, minutes: target } as never))}
            >
              {done ? 'Done' : 'Log'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BinaryRow({ goal, todayISO }: { goal: Goal; todayISO: string }) {
  const { logs, setLog, clearLog } = useData();
  const version = versionForDate(goal, todayISO);
  const label = version?.config.kind === 'daily_binary' ? version.config.label : undefined;
  const log = logFor(goal.id, todayISO, logs);
  const done = log?.value.kind === 'daily_binary' && log.value.done;

  return (
    <div className="goal-row">
      <div>
        <div className="goal-name">{goal.name}</div>
        {label && <div className="goal-sub">{label}</div>}
      </div>
      <button
        className={`tap${done ? ' done' : ''}`}
        onClick={() => (done ? clearLog(goal.id, todayISO) : setLog(goal.id, todayISO, { kind: 'daily_binary', done: true }))}
      >
        {done ? 'Done' : 'Log'}
      </button>
    </div>
  );
}

function InvertedRow({ goal, todayISO }: { goal: Goal; todayISO: string }) {
  const { logs, setLog, clearLog } = useData();
  const log = logFor(goal.id, todayISO, logs);
  const occurred = log?.value.kind === 'inverted_binary' && log.value.occurred;
  const time = log?.value.kind === 'inverted_binary' ? log.value.time : undefined;

  return (
    <div className="goal-row">
      <div>
        <div className="goal-name">{goal.name}</div>
        {occurred && time && <div className="goal-sub">Logged at {time}</div>}
      </div>
      <button
        className="tap"
        onClick={() => {
          if (occurred) clearLog(goal.id, todayISO);
          else {
            const now = new Date();
            const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setLog(goal.id, todayISO, { kind: 'inverted_binary', occurred: true, time: t });
          }
        }}
      >
        {occurred ? 'Undo' : 'Log a slip'}
      </button>
    </div>
  );
}

export function Today() {
  const { goals, logs } = useData();
  const todayISO = today();
  const scheduled = goals.filter((g) => !g.archived && isScheduledOn(g, todayISO));
  const flag = computeFlag(goals, logs, todayISO);
  const verse = verseForDate(todayISO);

  return (
    <div>
      {flag && (
        <div className="flag-box">
          <p>{flag.text}</p>
        </div>
      )}

      {scheduled.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Nothing scheduled today.</p>}

      <div>
        {scheduled.map((goal) => {
          switch (goal.type) {
            case 'weekly_count':
              return <BoxingRow key={goal.id} goal={goal} todayISO={todayISO} />;
            case 'daily_time':
              return <SleepRow key={goal.id} goal={goal} todayISO={todayISO} />;
            case 'daily_duration':
              return <DurationRow key={goal.id} goal={goal} todayISO={todayISO} weekly={false} />;
            case 'weekly_duration':
              return <DurationRow key={goal.id} goal={goal} todayISO={todayISO} weekly={true} />;
            case 'daily_binary':
              return <BinaryRow key={goal.id} goal={goal} todayISO={todayISO} />;
            case 'inverted_binary':
              return <InvertedRow key={goal.id} goal={goal} todayISO={todayISO} />;
            default:
              return null;
          }
        })}
      </div>

      {!flag && (
        <div className="verse">
          {verse.text}
          <span className="ref">{verse.reference}</span>
        </div>
      )}
    </div>
  );
}
