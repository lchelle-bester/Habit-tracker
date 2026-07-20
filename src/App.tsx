import { useState } from 'react';
import './App.css';
import { DataProvider } from './storage/DataContext';
import { TodayView } from './components/Today/TodayView';
import { WeekView } from './components/Week/WeekView';
import { PatternsView } from './components/Patterns/PatternsView';
import { SettingsView } from './components/Settings/SettingsView';
import { todayISO, fromISODate } from './engine/date';

type View = 'today' | 'week' | 'patterns' | 'settings';

const NAV: Array<{ id: View; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'settings', label: 'Settings' },
];

function Shell() {
  const [view, setView] = useState<View>('today');
  const dateLabel = fromISODate(todayISO()).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="shell">
      <header className="app-header">
        <div className="app-header-row">
          <span className="app-wordmark">Ledger</span>
          <span className="app-date num">{dateLabel}</span>
        </div>
        <nav className="app-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={item.id === view ? 'nav-item nav-item-active' : 'nav-item'}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <hr className="hairline" />
      <main className="app-main">
        {view === 'today' && <TodayView />}
        {view === 'week' && <WeekView />}
        {view === 'patterns' && <PatternsView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

export default App;
