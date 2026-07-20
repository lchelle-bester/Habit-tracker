import type { ReactNode } from 'react'
import { NavTabs } from './NavTabs'
import './layout.css'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      <NavTabs />
    </div>
  )
}
