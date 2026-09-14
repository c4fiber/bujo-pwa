import { NavLink } from 'react-router-dom'
import { NAV_TABS } from './navTabs'

// 좁은 화면(접힘/일반 폰): 하단 탭바. 펼침(fold+)에서는 좌측 레일로 대체되므로 숨김.
export function BottomNav() {
  return (
    <nav className="fold:hidden border-t border-surface-2 bg-surface-1 flex">
      {NAV_TABS.map(tab => (
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
