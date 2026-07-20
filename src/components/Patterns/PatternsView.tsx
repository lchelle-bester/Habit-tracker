import type { ReactNode } from 'react';
import { useData } from '../../storage/DataContext';
import { bedTimeCorrelation, allStreaks } from '../../engine/stats';
import { SleepOverlayChart } from './charts/SleepOverlayChart';
import { DayOfWeekChart } from './charts/DayOfWeekChart';
import { ScrollingChart } from './charts/ScrollingChart';
import { WeeklyTrendChart } from './charts/WeeklyTrendChart';
import { BoxingSleepChart } from './charts/BoxingSleepChart';
import './Patterns.css';

function Section({ title, question, children }: { title: string; question: string; children: ReactNode }) {
  return (
    <section className="pattern-section">
      <h2 className="pattern-title">{title}</h2>
      <p className="pattern-question">{question}</p>
      {children}
    </section>
  );
}

export function PatternsView() {
  const { goals, logs } = useData();
  const activeGoals = goals.filter((g) => !g.archived);
  const sleepGoal = activeGoals.find((g) => g.type === 'daily_time');
  const boxingGoal = activeGoals.find((g) => g.type === 'weekly_count');
  const scrollingGoal = activeGoals.find((g) => g.type === 'inverted_binary');

  const correlation = sleepGoal ? bedTimeCorrelation(sleepGoal, activeGoals, logs) : null;
  const streaks = allStreaks(activeGoals, logs);

  if (activeGoals.length === 0) {
    return <p className="today-empty">No active goals yet.</p>;
  }

  return (
    <div className="patterns-view">
      {sleepGoal && (
        <Section title="Sleep as leading indicator" question="Does a late night show up in the other five goals?">
          <SleepOverlayChart sleepGoal={sleepGoal} goals={activeGoals} logs={logs} days={30} />
        </Section>
      )}

      {correlation && (correlation.onTargetRate !== null || correlation.lateRate !== null) && (
        <Section title="Bed time correlation" question="Does the next day actually go better after an on-target night?">
          <div className="correlation-stat">
            <div className="correlation-figure">
              <span className="correlation-number num">
                {correlation.onTargetRate !== null ? `${Math.round(correlation.onTargetRate * 100)}%` : '—'}
              </span>
              <span className="chart-axis-label">after on-target ({correlation.onTargetN})</span>
            </div>
            <div className="correlation-figure">
              <span className="correlation-number num correlation-number-dim">
                {correlation.lateRate !== null ? `${Math.round(correlation.lateRate * 100)}%` : '—'}
              </span>
              <span className="chart-axis-label">after late ({correlation.lateN})</span>
            </div>
          </div>
        </Section>
      )}

      <Section title="Day-of-week failure rates" question="Which days actually break, per goal?">
        <DayOfWeekChart goals={activeGoals.filter((g) => g.type !== 'weekly_duration')} logs={logs} />
      </Section>

      {scrollingGoal && (
        <Section title="Scrolling incidence" question="Is it clustering on particular days or times?">
          <ScrollingChart goal={scrollingGoal} logs={logs} days={30} />
        </Section>
      )}

      <Section title="Weekly completion, 8-week rolling" question="Which goals are trending up or down?">
        <WeeklyTrendChart goals={activeGoals} logs={logs} weeks={8} />
      </Section>

      {boxingGoal && (
        <Section title="Boxing against sleep" question="Do bad sleep weeks show up as light boxing weeks?">
          <BoxingSleepChart boxingGoal={boxingGoal} sleepGoal={sleepGoal} logs={logs} weeks={10} />
        </Section>
      )}

      <Section title="Runs" question="Current and longest streaks, positive goals only.">
        <div className="streaks-list">
          {streaks.map(({ goal, streak }) => (
            <div className="streak-row" key={goal.id}>
              <span className="chart-row-label streak-name">{goal.name}</span>
              <span className="num streak-value">
                {streak.current} current <span className="chart-axis-label">· {streak.longest} longest</span>
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
