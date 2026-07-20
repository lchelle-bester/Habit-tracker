import { useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { exportAppDataAsFile, ImportValidationError, parseImportedAppData } from '../../storage/exportImport'
import { Button } from '../ui/Button'

export function ExportImportPanel() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const settings = useAppStore((s) => s.settings)
  const meta = useAppStore((s) => s.meta)
  const importAppData = useAppStore((s) => s.importAppData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    exportAppDataAsFile({ schemaVersion: 1, goals, entries, settings, meta })
  }

  const handleFileChosen = async (file: File) => {
    setError(null)
    try {
      const text = await file.text()
      const data = parseImportedAppData(text)
      const ok = window.confirm('Importing will replace all current data on this device. Continue?')
      if (ok) importAppData(data)
    } catch (err) {
      setError(err instanceof ImportValidationError ? err.message : 'Import failed.')
    }
  }

  return (
    <div className="export-import-panel">
      <div className="export-import-panel__row">
        <span>Export all data as a JSON file — the escape hatch out of localStorage.</span>
        <Button onClick={handleExport}>Export</Button>
      </div>
      <div className="export-import-panel__row">
        <span>Import a previously exported file. Replaces everything on this device.</span>
        <Button onClick={() => fileInputRef.current?.click()}>Import</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileChosen(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="export-import-panel__error">{error}</p>}
    </div>
  )
}
