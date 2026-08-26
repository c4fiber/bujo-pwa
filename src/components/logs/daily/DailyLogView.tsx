import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useDailyLog } from '../../../hooks/useDailyLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { OverdueSection } from './OverdueSection'
import { formatDisplay, nextDay, prevDay, toDateString } from '../../../utils/dateUtils'

export function DailyLogView() {
  const { activeDate, setActiveDate } = useUIStore()
  const { entries, addEntry, updateStatus, updateContent, deleteEntry, moveToDate } = useDailyLog(activeDate)
  const today = toDateString(new Date())
  const isToday = activeDate === today

  const activeEntries   = entries.filter(e => e.origin !== 'migrated')
  const migratedEntries = entries.filter(e => e.origin === 'migrated')

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 네비 + 캘린더 이동 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={() => setActiveDate(prevDay(activeDate))} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300 font-mono">{formatDisplay(activeDate)}</span>
          {/* 캘린더로 원하는 날짜 이동 */}
          <label className="relative cursor-pointer text-accent-blue hover:text-accent-blue/80" title="날짜 선택">
            <span className="text-sm">📅</span>
            <input
              type="date"
              value={activeDate}
              onChange={e => e.target.value && setActiveDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
          {!isToday && (
            <button
              onClick={() => setActiveDate(today)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-zinc-400 hover:text-white transition-colors"
            >
              오늘
            </button>
          )}
        </div>
        <button onClick={() => setActiveDate(nextDay(activeDate))} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      {/* 엔트리 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">

        {/* 밀린 항목 (오늘 볼 때만) */}
        {isToday && <OverdueSection today={today} />}

        {/* 활성 항목 (직접 작성 + Future에서 편성) */}
        <AnimatePresence initial={false}>
          {activeEntries.map(entry => (
            <EntryItem
              key={entry.id}
              entry={entry}
              origin={entry.origin}
              onStatusChange={updateStatus}
              onContentChange={updateContent}
              onDelete={deleteEntry}
              onMoveToDate={moveToDate}
            />
          ))}
        </AnimatePresence>

        {/* 다른 날짜로 이동됨 */}
        {migratedEntries.length > 0 && (
          <>
            <div className="text-[10px] text-accent-amber/60 font-mono px-1 pt-3 pb-0.5 flex items-center gap-1">
              <span>📅</span>
              <span>이동됨 — 탭하여 취소선 처리</span>
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
