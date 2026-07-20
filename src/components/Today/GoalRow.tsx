import { useState } from 'react';
import type { Goal } from '../../types';
import { useData } from '../../storage/DataContext';
import { addDays, formatMinutesDelta, minutesToDelta, todayISO } from '../../engine/date';
import { evaluateWeek, logFor, timeTargetForDate } from '../../engine/evaluate';
import { targetForDate } from '../../engine/targets';

function DurationControl({ goal, date }: { goal: Goal; date: string }) {
  const { logs, setLog } = useData();
  const [editing, setEditing] = useState(false);
  const target = targetForDate(goal, date);
  const minutes = target?.value.type === 'daily_duration' || target?.value.type === 'weekly_duration' ? target.value.minutes : 0;
  const log = logFor(logs, goal.id, date);
  const logged = log?.minutes;

  if (logged !== undefined && !editing) {
    return (
      <button className="control-value" onClick={() => setEditing(true)}>
        {logged} min
      </button>
    );
  }

  if (editing) {
    return (
      <input
        className="control-input"
        type="number"
        inputMode="numeric"
        autoFocus
        defaultValue={logged ?? minutes}
        onBlur={(e) => {
          const val = Number(e.target.value);
          if (!Number.isNaN(val)) setLog(goal.id, date, { minutes: val });
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
    );
  }

  return (
    <span className="control-group">
      <button className="control-chip" onClick={() => setLog(goal.id, date, { minutes })}>
        {minutes}
      </button>
      <button className="control-text" onClick={() => setEditing(true)}>
        other
      </button>
    </span>
  );
}

function BinaryControl({ goal, date }: { goal: Goal; date: string }) {
  const { logs, setLog } = useData();
  const log = logFor(logs, goal.id, date);
  const done = !!log?.done;
  return (
    <button className={done ? 'control-toggle control-toggle-on' : 'control-toggle'} onClick={() => setLog(goal.id, date, { done: !done })}>
      {done ? 'Done' : 'Mark done'}
    </button>
  );
}

function BoxingControl({ goal, date }: { goal: Goal; date: string }) {
  const { logs, setLog } = useData();
  const log = logFor(logs, goal.id, date);
  const done = !!log?.done;
  return (
    <button className={done ? 'control-toggle control-toggle-on' : 'control-toggle'} onClick={() => setLog(goal.id, date, { done: !done })}>
      {done ? 'Trained' : 'Log session'}
    </button>
  );
}

function TimeControl({ goal, date }: { goal: Goal; date: string }) {
  const { logs, setLog } = useData();
  const [editing, setEditing] = useState(false);
  const targetTime = timeTargetForDate(goal, date) ?? '23:00';
  const log = logFor(logs, goal.id, date);
  const loggedTime = log?.time;

  if (loggedTime && !editing) {
    const delta = minutesToDelta(loggedTime, targetTime);
    return (
      <button className="control-value" onClick={() => setEditing(true)}>
        <span className="num">{loggedTime}</span>
        <span className={delta > 0 ? 'control-delta control-delta-late' : 'control-delta'}> {formatMinutesDelta(delta)}</span>
      </button>
    );
  }

  if (editing) {
    return (
      <input
        className="control-input"
        type="time"
        autoFocus
        defaultValue={loggedTime ?? targetTime}
        onBlur={(e) => {
          if (e.target.value) setLog(goal.id, date, { time: e.target.value });
          setEditing(false);
        }}
      />
    );
  }

  return (
    <span className="control-group">
      <button className="control-chip" onClick={() => setLog(goal.id, date, { time: targetTime })}>
        On time
      </button>
      <button className="control-text" onClick={() => setEditing(true)}>
        log time
      </button>
    </span>
  );
}

function InvertedControl({ goal, date }: { goal: Goal; date: string }) {
  const { logs, setLog } = useData();
  const log = logFor(logs, goal.id, date);
  const count = log?.count ?? 0;

  if (count === 0) {
    return (
      <button
        className="control-text"
        onClick={() => setLog(goal.id, date, { count: 1, timesOfDay: [new Date().toTimeString().slice(0, 5)] })}
      >
        log a slip
      </button>
    );
  }

  return (
    <span className="control-group">
      <span className="control-value control-delta-late">{count} today</span>
      <button
        className="control-text"
        onClick={() => setLog(goal.id, date, { count: count + 1, timesOfDay: [...(log?.timesOfDay ?? []), new Date().toTimeString().slice(0, 5)] })}
      >
        +1
      </button>
      <button className="control-text" onClick={() => setLog(goal.id, date, { count: 0, timesOfDay: [] })}>
        undo
      </button>
    </span>
  );
}

export function GoalRow({ goal }: { goal: Goal }) {
  const { logs } = useData();
  const today = todayISO();

  if (goal.type === 'weekly_count') {
    const week = evaluateWeek(goal, today, logs);
    const sub = week ? `Week: ${week.actual} of ${week.target}${week.floor !== undefined ? ` · floor ${week.floor}` : ''}` : '';
    return (
      <div className="goal-row">
        <div className="goal-row-main">
          <div className="goal-row-name">{goal.name}</div>
          <div className="goal-row-sub num">{sub}</div>
        </div>
        <div className="goal-row-control">
          <BoxingControl goal={goal} date={today} />
        </div>
      </div>
    );
  }

  if (goal.type === 'daily_time') {
    // Bed time is only knowable in hindsight, so "today" for sleep means
    // reporting on last night, not tonight (which hasn't happened yet).
    const lastNight = addDays(today, -1);
    const targetTime = timeTargetForDate(goal, lastNight);
    return (
      <div className="goal-row">
        <div className="goal-row-main">
          <div className="goal-row-name">{goal.name}</div>
          <div className="goal-row-sub num">last night · target {targetTime}</div>
        </div>
        <div className="goal-row-control">
          <TimeControl goal={goal} date={lastNight} />
        </div>
      </div>
    );
  }

  if (goal.type === 'weekly_duration') {
    const target = targetForDate(goal, today);
    const minutes = target?.value.type === 'weekly_duration' ? target.value.minutes : 0;
    return (
      <div className="goal-row">
        <div className="goal-row-main">
          <div className="goal-row-name">{goal.name}</div>
          <div className="goal-row-sub num">target {minutes} min this week</div>
        </div>
        <div className="goal-row-control">
          <DurationControl goal={goal} date={today} />
        </div>
      </div>
    );
  }

  if (goal.type === 'daily_duration') {
    const target = targetForDate(goal, today);
    const minutes = target?.value.type === 'daily_duration' ? target.value.minutes : 0;
    return (
      <div className="goal-row">
        <div className="goal-row-main">
          <div className="goal-row-name">{goal.name}</div>
          <div className="goal-row-sub num">target {minutes} min</div>
        </div>
        <div className="goal-row-control">
          <DurationControl goal={goal} date={today} />
        </div>
      </div>
    );
  }

  if (goal.type === 'inverted_binary') {
    return (
      <div className="goal-row">
        <div className="goal-row-main">
          <div className="goal-row-name">{goal.name}</div>
          <div className="goal-row-sub">absence is the goal</div>
        </div>
        <div className="goal-row-control">
          <InvertedControl goal={goal} date={today} />
        </div>
      </div>
    );
  }

  // daily_binary
  return (
    <div className="goal-row">
      <div className="goal-row-main">
        <div className="goal-row-name">{goal.name}</div>
        <div className="goal-row-sub">today</div>
      </div>
      <div className="goal-row-control">
        <BinaryControl goal={goal} date={today} />
      </div>
    </div>
  );
}
