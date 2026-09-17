import { NavLink, useLocation } from 'react-router-dom'
import { NAV_TABS } from './navTabs'
import { useUIStore } from '../../store/uiStore'

// 좁은 화면(접힘/일반 폰): 하단 탭바. 펼침(fold+)에서는 좌측 레일로 대체되므로 숨김.
export function BottomNav() {
  const location = useLocation()
  const goDailyHome = useUIStore(s => s.goDailyHome)
  const base = '/' + location.pathname.split('/')[1]

  return (
    <nav className="fold:hidden border-t border-surface-2 bg-surface-1 flex">
      {NAV_TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          onClick={() => {
            // 이미 Daily 탭에 있는데 다시 터치하면 오늘로 이동
            if (tab.to === '/daily' && base === '/daily') goDailyHome()
          }}
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
