import { NavLink } from 'react-router-dom'
import { NAV_TABS } from './navTabs'

// 넓은 화면(Fold 펼침 이상): 좌측 세로 내비게이션 레일.
export function SideNav() {
  return (
    <nav className="hidden fold:flex flex-col shrink-0 w-40 border-r border-surface-2 bg-surface-1 py-4 gap-1">
      <div className="px-4 pb-4">
        <span className="text-sm font-mono text-white tracking-widest">BuJo</span>
      </div>
      {NAV_TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
              isActive ? 'bg-surface-2 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-2/50'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="text-sm font-mono">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
