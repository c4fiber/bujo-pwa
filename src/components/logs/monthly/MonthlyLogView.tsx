import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useMonthlyLog } from '../../../hooks/useMonthlyLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { format, parseISO } from 'date-fns'
import { formatMonthDisplay, nextMonth, prevMonth } from '../../../utils/dateUtils'
import type { BulletType, EntryOrigin } from '../../../types/journal'

export function MonthlyLogView() {
  const { activeYear, activeMonth, setActiveYear, setActiveMonth, setActiveDate } = useUIStore()
  const navigate = useNavigate()
  const { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture, migrateToNextMonth } = useMonthlyLog(activeYear, activeMonth)
  const [composerDate, setComposerDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const goNext = () => {
    const { year, month } = nextMonth(activeYear, activeMonth)
    setActiveYear(year); setActiveMonth(month)
  }
  const goPrev = () => {
    const { year, month } = prevMonth(activeYear, activeMonth)
    setActiveYear(year); setActiveMonth(month)
  }

  const handleAdd = (content: string, bulletType: BulletType) => {
    addEntry(content, bulletType, composerDate || undefined)
    setComposerDate('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={goPrev} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <span className="text-sm text-zinc-300 font-mono">{formatMonthDisplay(activeYear, activeMonth)}</span>
        <button onClick={goNext} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence initial={false}>
          {entries.map(entry => {
            const d = parseISO(entry.scheduledDate ?? entry.createdAt)
            const dayNum = format(d, 'd')
            const dayOfWeek = format(d, 'EEE')
            return (
              <div key={entry.id} className="group/row flex items-start gap-2">
                {/* 날짜 컬럼 — scheduledDate 있으면 탭으로 Daily 이동 */}
                {entry.scheduledDate ? (
                  <button
                    className="w-9 shrink-0 pt-2 text-right active:opacity-60 transition-opacity"
                    onClick={() => { setActiveDate(entry.scheduledDate!); navigate('/daily') }}
                    title="Daily Log로 이동"
                  >
                    <div className="text-xs font-mono text-accent-blue leading-none">{dayNum}</div>
                    <div className="text-[10px] font-mono text-accent-blue/50 leading-none mt-0.5">{dayOfWeek}</div>
                  </button>
                ) : (
                  <div className="w-9 shrink-0 pt-2 text-right">
                    <div className="text-xs font-mono text-zinc-400 leading-none">{dayNum}</div>
                    <div className="text-[10px] font-mono text-zinc-600 leading-none mt-0.5">{dayOfWeek}</div>
                  </div>
                )}
                {/* 항목 + 날짜 지정 */}
                <div className="flex-1 min-w-0">
                  <EntryItem
                    entry={entry}
                    origin={(entry.sourceId ? 'from-future' : 'manual') as EntryOrigin}
                    onStatusChange={updateStatus}
                    onContentChange={entry.sourceId ? undefined : updateContent}
                    onDelete={entry.sourceId ? undefined : deleteEntry}
                    onMigrateNext={entry.sourceId ? undefined : (id, content, bulletType) => migrateToNextMonth(id, content, bulletType)}
                    onScheduleToFuture={entry.sourceId ? undefined : scheduleToFuture}
                  />
                  <div className="pl-8 pb-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <input
                      type="date"
                      className="text-[10px] font-mono bg-transparent text-zinc-500 border-none outline-none"
                      value={entry.scheduledDate ?? ''}
                      onChange={e => setScheduledDate(entry.id, e.target.value || undefined)}
                      title="예정일 변경 (메모용)"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-zinc-700 text-sm mt-12"
          >
            이달의 계획을 세워보세요
          </motion.p>
        )}
      </div>

      <EntryComposer
        onAdd={handleAdd}
        placeholder="월간 항목 입력…"
        extraFields={
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>날짜 지정:</span>
            <input
              type="date"
              className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
              value={composerDate}
              onChange={e => setComposerDate(e.target.value)}
            />
          </div>
        }
      />
    </div>
  )
}
