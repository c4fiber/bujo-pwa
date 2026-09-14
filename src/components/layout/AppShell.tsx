import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'

export function AppShell() {
  const location = useLocation()

  return (
    // 좁을 땐 세로 스택(상단바+본문+하단탭), 펼침(fold+)에선 가로 스택(좌측 레일+본문)
    <div className="flex flex-col fold:flex-row h-screen bg-surface text-white">
      <SideNav />

      <div className="flex flex-1 flex-col min-w-0">
        {/* 좁은 화면에서만 상단바 노출 (넓은 화면은 SideNav가 타이틀 역할) */}
        <div className="fold:hidden">
          <TopBar />
        </div>

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname.split('/')[1]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* 넓은 화면에서 본문을 읽기 좋은 폭으로 중앙 정렬 */}
              <div className="flex flex-col h-full w-full max-w-md fold:max-w-3xl mx-auto">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
