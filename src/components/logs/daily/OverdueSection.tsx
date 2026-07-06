import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOverdueTasks } from '../../../hooks/useOverdueTasks'
import { formatDisplay } from '../../../utils/dateUtils'

export function OverdueSection({ today }: { today: string }) {
  const { overdue, bringToToday, setStatus } = useOverdueTasks(today)
  const [collapsed, setCollapsed] = useState(false)

  if (overdue.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 rounded-lg border border-accent-amber/30 bg-amber-950/10 overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-950/20 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-xs font-mono text-accent-amber flex items-center gap-1.5">
          <span>●</span>
          밀린 항목 {overdue.length}개
        </span>
        <span className="text-accent-amber/50 text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] text-zinc-500 px-3 pb-1.5 leading-relaxed">
              지난 미완료 항목입니다. 지금도 필요한 일만 오늘로 가져오고,
              나머지는 완료·취소로 정리하세요.
            </p>
            <div className="px-2 pb-2 space-y-1">
              {overdue.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-1/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 break-words">{entry.content}</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{formatDisplay(entry.date)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => bringToToday(entry)}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/30 transition-colors"
                      title="오늘로 가져오기"
                    >
                      오늘로
                    </button>
                    <button
                      onClick={() => setStatus(entry.id, 'completed')}
                      className="text-xs px-1.5 py-1 rounded text-zinc-500 hover:text-accent-green transition-colors"
                      title="완료 처리"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setStatus(entry.id, 'cancelled')}
                      className="text-xs px-1.5 py-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      title="취소 처리"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
