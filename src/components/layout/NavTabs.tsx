import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Today' },
  { to: '/week', label: 'Week' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/settings', label: 'Settings' },
]

export function NavTabs() {
  return (
    <nav className="nav-tabs">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `nav-tab${isActive ? ' nav-tab--active' : ''}`}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
