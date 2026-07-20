import { GoalList } from '../components/settings/GoalList'
import { ExportImportPanel } from '../components/settings/ExportImportPanel'
import { Rule } from '../components/ui/Rule'
import '../components/settings/settings.css'

export function SettingsPage() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">
        <div className="settings-section__label">Goals</div>
        <GoalList />
      </div>

      <Rule strong />

      <div className="settings-section" style={{ marginTop: 'var(--space-6)' }}>
        <div className="settings-section__label">Data</div>
        <ExportImportPanel />
      </div>
    </div>
  )
}
