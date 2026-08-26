import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/future',   label: 'Future',   icon: '◎' },
  { to: '/daily',    label: 'Daily',    icon: '◦' },
  { to: '/routine',  label: 'Routine',  icon: '▦' },
  { to: '/review',   label: 'Review',   icon: '≡' },
  { to: '/settings', label: 'Settings', icon: '⊙' },
]

export function BottomNav() {
  return (
    <nav className="border-t border-surface-2 bg-surface-1 flex">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
              isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="text-[10px] font-mono">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
