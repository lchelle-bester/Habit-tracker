import { useData } from '../context/DataContext';
import { today, formatShortDate } from '../utils/date';
import { WEEKDAY_LABEL, WEEKDAYS } from '../types/goal';
import { isPositiveGoal } from '../engine/goalEngine';
import { computeRun } from '../engine/streaks';
import {
  sleepDeltaSeries,
  bedtimeCorrelation,
  dayOfWeekFailureRates,
  scrollingIncidence,
  weeklyCompletionTrend,
  boxingVsSleep,
} from '../engine/stats';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';

const HOUR_LABELS = ['12a', '', '', '3a', '', '', '6a', '', '', '9a', '', '', '12p', '', '', '3p', '', '', '6p', '', '', '9p', '', ''];

export function Patterns() {
  const { goals, logs } = useData();
  const todayISO = today();
  const active = goals.filter((g) => !g.archived);

  const sleepGoal = active.find((g) => g.type === 'daily_time');
  const boxingGoal = active.find((g) => g.type === 'weekly_count');
  const scrollingGoal = active.find((g) => g.type === 'inverted_binary');
  const otherGoals = sleepGoal ? active.filter((g) => g.id !== sleepGoal.id) : active;

  return (
    <div>
      {sleepGoal && (
        <section className="chart-section">
          <div className="chart-question">Does a late night show up the next day?</div>
          <div className="chart-note">Sleep delta, last 8 weeks. Minutes past target bedtime — positive is late.</div>
          <SleepOverlay sleepGoal={sleepGoal} otherGoals={otherGoals} />
        </section>
      )}

      {sleepGoal && otherGoals.length > 0 && (
        <section className="chart-section">
          <div className="chart-question">What does an on-target bedtime actually buy?</div>
          <Correlation sleepGoal={sleepGoal} otherGoals={otherGoals} />
        </section>
      )}

      <section className="chart-section">
        <div className="chart-question">Which days actually break?</div>
        <div className="chart-note">Failure rate by day of week.</div>
        <div className="small-multiples">
          {active.map((g) => (
            <DayOfWeekRow key={g.id} goalId={g.id} name={g.name} />
          ))}
        </div>
      </section>

      {scrollingGoal && (
        <section className="chart-section">
          <div className="chart-question">When does scrolling happen?</div>
          <ScrollingSection goalId={scrollingGoal.id} />
        </section>
      )}

      <section className="chart-section">
        <div className="chart-question">Is it getting better or worse?</div>
        <div className="chart-note">Weekly completion, 8-week rolling.</div>
        <div className="small-multiples">
          {active.map((g) => (
            <TrendRow key={g.id} goalId={g.id} name={g.name} />
          ))}
        </div>
      </section>

      {boxingGoal && sleepGoal && (
        <section className="chart-section">
          <div className="chart-question">Does sleep track with sessions trained?</div>
          <div className="chart-note">Boxing sessions per week against average sleep delta that week.</div>
          <BoxingVsSleep boxingGoal={boxingGoal} sleepGoal={sleepGoal} />
        </section>
      )}

      <section className="chart-section">
        <div className="chart-question">Current and longest runs</div>
        <div>
          {active.filter(isPositiveGoal).map((g) => {
            const run = computeRun(g, logs, todayISO);
            if (!run) return null;
            return (
              <div className="run-row" key={g.id}>
                <div className="goal-name">{g.name}</div>
                <div className="run-numbers">
                  <div>
                    <div className="stat-value num">{run.current}</div>
                    <div className="stat-label">current {run.unit}</div>
                  </div>
                  <div>
                    <div className="stat-value num">{run.longest}</div>
                    <div className="stat-label">longest {run.unit}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SleepOverlay({ sleepGoal, otherGoals }: { sleepGoal: import('../types/goal').Goal; otherGoals: import('../types/goal').Goal[] }) {
  const { logs } = useData();
  const todayISO = today();
  const series = sleepDeltaSeries(sleepGoal, otherGoals, logs, 56, todayISO);

  return (
    <div>
      <LineChart
        points={series.map((p) => ({ y: p.delta }))}
        zeroLine
        formatValue={(v) => `${v > 0 ? '+' : ''}${v}m`}
      />
      <div className="overlay-strip">
        {series
          .filter((_, i) => i % 4 === 0)
          .map((p) => (
            <div className="overlay-strip-col" key={p.date}>
              {otherGoals.slice(0, 5).map((g) => {
                const o = p.others.find((x) => x.goalId === g.id);
                return (
                  <span
                    key={g.id}
                    className={`mark ${o?.pass === true ? 'mark-pass' : o?.pass === false ? 'mark-fail' : 'mark-not_scheduled'}`}
                    style={{ width: 5, height: 5 }}
                    title={g.name}
                  />
                );
              })}
            </div>
          ))}
      </div>
      <div className="chart-note" style={{ marginTop: 'var(--space-2)' }}>
        {formatShortDate(series[0].date)} – {formatShortDate(series[series.length - 1].date)}. Dots below mark the other
        goals passing (filled) or failing (hollow) that day.
      </div>
    </div>
  );
}

function Correlation({ sleepGoal, otherGoals }: { sleepGoal: import('../types/goal').Goal; otherGoals: import('../types/goal').Goal[] }) {
  const { logs } = useData();
  const todayISO = today();
  const c = bedtimeCorrelation(sleepGoal, otherGoals, logs, todayISO);

  if (c.onTimeRate === null && c.lateRate === null) {
    return <div className="chart-empty">Not enough data yet.</div>;
  }

  return (
    <div className="stat-pair">
      <div className="stat-block">
        <div className="stat-value num">{c.onTimeRate ?? '—'}%</div>
        <div className="stat-label">completion after on-target ({c.onTimeN})</div>
      </div>
      <div className="stat-block">
        <div className="stat-value num">{c.lateRate ?? '—'}%</div>
        <div className="stat-label">completion after late ({c.lateN})</div>
      </div>
    </div>
  );
}

function DayOfWeekRow({ goalId, name }: { goalId: string; name: string }) {
  const { goals, logs } = useData();
  const todayISO = today();
  const goal = goals.find((g) => g.id === goalId)!;
  const rates = dayOfWeekFailureRates(goal, logs, todayISO);
  const values = WEEKDAYS.map((wd) => rates[wd]);
  if (values.every((v) => v === null)) return null;

  return (
    <div>
      <div className="small-multiple-title">{name}</div>
      <BarChart categories={WEEKDAYS.map((wd) => WEEKDAY_LABEL[wd])} values={values} max={100} formatValue={(v) => `${v}%`} height={70} />
    </div>
  );
}

function ScrollingSection({ goalId }: { goalId: string }) {
  const { goals, logs } = useData();
  const goal = goals.find((g) => g.id === goalId)!;
  const inc = scrollingIncidence(goal, logs);

  if (inc.totalLogged === 0) {
    return <div className="chart-empty">No slips logged yet.</div>;
  }

  return (
    <div>
      <div className="small-multiple-title">By day of week</div>
      <BarChart categories={WEEKDAYS.map((wd) => WEEKDAY_LABEL[wd])} values={WEEKDAYS.map((wd) => inc.byWeekday[wd])} height={70} />
      {inc.totalWithTime > 0 && (
        <div style={{ marginTop: 'var(--space-5)' }}>
          <div className="small-multiple-title">By time of day</div>
          <BarChart categories={HOUR_LABELS} values={inc.byHour} height={70} />
        </div>
      )}
    </div>
  );
}

function TrendRow({ goalId, name }: { goalId: string; name: string }) {
  const { goals, logs } = useData();
  const todayISO = today();
  const goal = goals.find((g) => g.id === goalId)!;
  const points = weeklyCompletionTrend(goal, logs, todayISO, 8);
  if (points.every((p) => p.rate === null)) return null;

  return (
    <div>
      <div className="small-multiple-title">{name}</div>
      <LineChart points={points.map((p) => ({ y: p.rate }))} formatValue={(v) => `${Math.round(v)}%`} height={60} />
    </div>
  );
}

function BoxingVsSleep({ boxingGoal, sleepGoal }: { boxingGoal: import('../types/goal').Goal; sleepGoal: import('../types/goal').Goal }) {
  const { logs } = useData();
  const todayISO = today();
  const points = boxingVsSleep(boxingGoal, sleepGoal, logs, todayISO, 12);

  return (
    <div>
      <BarChart
        categories={points.map((p) => formatShortDate(p.weekStart))}
        values={points.map((p) => p.sessions)}
        max={Math.max(4, ...points.map((p) => p.sessions))}
        height={70}
      />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <LineChart points={points.map((p) => ({ y: p.avgSleepDelta }))} zeroLine formatValue={(v) => `${v > 0 ? '+' : ''}${v}m`} height={60} />
      </div>
    </div>
  );
}
