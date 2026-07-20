import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useAppStore } from './state/store'
import { AppShell } from './components/layout/AppShell'
import { TodayPage } from './routes/TodayPage'
import { WeekPage } from './routes/WeekPage'
import { PatternsPage } from './routes/PatternsPage'
import { SettingsPage } from './routes/SettingsPage'

function useThemeEffect() {
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
}

function App() {
  useThemeEffect()

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
