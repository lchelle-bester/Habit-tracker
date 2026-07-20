import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Today' },
  { to: '/week', label: 'Week' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/settings', label: 'Settings' },
]

function activeIndex(pathname: string): number {
  if (pathname === '/' || pathname === '') return 0
  const idx = TABS.findIndex((t) => t.to !== '/' && pathname.startsWith(t.to))
  return idx === -1 ? 0 : idx
}

export function NavTabs() {
  const location = useLocation()
  const index = activeIndex(location.pathname)

  return (
    <nav className="nav-tabs">
      <span className="nav-tabs__indicator" style={{ transform: `translateX(${index * 100}%)` }} />
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `nav-tab${isActive ? ' nav-tab--active' : ''}`}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
