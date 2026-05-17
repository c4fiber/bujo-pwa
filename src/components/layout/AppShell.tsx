import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { useSyncMonthlyToDaily } from '../../hooks/useSyncMonthlyToDaily'
import { useCarryForward } from '../../hooks/useCarryForward'
import { useUIStore } from '../../store/uiStore'

export function AppShell() {
  const { activeYear } = useUIStore()
  useSyncMonthlyToDaily(activeYear)
  useCarryForward()
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-surface text-white max-w-md mx-auto">
      <TopBar />
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname.split('/')[1]}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
