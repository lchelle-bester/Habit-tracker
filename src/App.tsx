import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Today } from './views/Today';
import { Week } from './views/Week';
import { Patterns } from './views/Patterns';
import { Settings } from './views/Settings';
import { formatDayLabel, today } from './utils/date';

type Tab = 'today' | 'week' | 'patterns' | 'settings';

const TAB_LABEL: Record<Tab, string> = {
  today: 'Today',
  week: 'Week',
  patterns: 'Patterns',
  settings: 'Settings',
};

function Shell() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">{TAB_LABEL[tab]}</div>
        <div className="app-date">{formatDayLabel(today())}</div>
      </header>
      <main className="view">
        {tab === 'today' && <Today />}
        {tab === 'week' && <Week />}
        {tab === 'patterns' && <Patterns />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabs">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}
