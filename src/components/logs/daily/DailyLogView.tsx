import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useDailyLog } from '../../../hooks/useDailyLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { OverdueSection } from './OverdueSection'
import { formatDisplay, nextDay, prevDay, toDateString } from '../../../utils/dateUtils'
export function DailyLogView() {
  const { activeDate, setActiveDate } = useUIStore()
  const { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly } = useDailyLog(activeDate)
  const today = toDateString(new Date())
  const isToday = activeDate === today

  const manualEntries   = entries.filter(e => e.origin === 'manual')
  const migratedEntries = entries.filter(e => e.origin === 'migrated')

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 네비 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={() => setActiveDate(prevDay(activeDate))} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <span className="text-sm text-zinc-300 font-mono">{formatDisplay(activeDate)}</span>
        <button onClick={() => setActiveDate(nextDay(activeDate))} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      {/* 엔트리 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">

        {/* 밀린 항목 (오늘 볼 때만) */}
        {isToday && <OverdueSection today={today} />}

        {/* 직접 작성한 항목 */}
        <AnimatePresence initial={false}>
          {manualEntries.map(entry => (
            <EntryItem
              key={entry.id}
              entry={entry}
              origin="manual"
              onStatusChange={updateStatus}
              onContentChange={updateContent}
              onDelete={deleteEntry}
              onScheduleToMonthly={scheduleToMonthly}
            />
          ))}
        </AnimatePresence>

        {/* 이월된 항목 (>) */}
        {migratedEntries.length > 0 && (
          <>
            <div className="text-[10px] text-accent-amber/60 font-mono px-1 pt-3 pb-0.5 flex items-center gap-1">
              <span>&gt;</span>
              <span>이월됨 — 탭하여 취소선 처리</span>
            </div>
            <AnimatePresence initial={false}>
              {migratedEntries.map(entry => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  origin="migrated"
                  onStatusChange={updateStatus}
                  onDelete={deleteEntry}
                  readOnly
                />
              ))}
            </AnimatePresence>
          </>
        )}

        {entries.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-zinc-700 text-sm mt-12"
          >
            오늘의 일지를 시작하세요
          </motion.p>
        )}
      </div>

      <EntryComposer onAdd={addEntry} placeholder="오늘의 항목 입력…" />
    </div>
  )
}
