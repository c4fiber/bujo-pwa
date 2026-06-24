import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useMonthlyLog } from '../../../hooks/useMonthlyLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { format, parseISO } from 'date-fns'
import { formatMonthDisplay, nextMonth, prevMonth, MONTHS_KO } from '../../../utils/dateUtils'
import type { BulletType, EntryOrigin } from '../../../types/journal'

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function MonthlyLogView() {
  const { activeYear, activeMonth, setActiveYear, setActiveMonth, setActiveDate } = useUIStore()
  const navigate = useNavigate()
  const { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture, migrateToDaily } = useMonthlyLog(activeYear, activeMonth)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [composerMonth, setComposerMonth] = useState(activeMonth)
  const [composerDay, setComposerDay] = useState<number | ''>('')

  const goNext = () => {
    const { year, month } = nextMonth(activeYear, activeMonth)
    setActiveYear(year); setActiveMonth(month)
  }
  const goPrev = () => {
    const { year, month } = prevMonth(activeYear, activeMonth)
    setActiveYear(year); setActiveMonth(month)
  }

  const handleAdd = (content: string, bulletType: BulletType) => {
    const scheduledDate = composerDay !== ''
      ? `${activeYear}-${String(composerMonth).padStart(2, '0')}-${String(composerDay).padStart(2, '0')}`
      : undefined
    addEntry(content, bulletType, composerMonth, scheduledDate)
    setComposerDay('')
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
            const scheduled = entry.scheduledDate ? parseISO(entry.scheduledDate) : null
            const dayNum = scheduled ? format(scheduled, 'd') : null
            const dayOfWeek = scheduled ? format(scheduled, 'EEE') : null
            return (
              <div key={entry.id} className="group/row flex items-start gap-2">
                {/* 날짜 컬럼 — scheduledDate 있으면 탭으로 Daily 이동 */}
                {dayNum ? (
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
                    <div className="text-xs font-mono text-zinc-600 leading-none">—</div>
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
                    onMigrateToDaily={entry.sourceId ? undefined : (id, content, bulletType) => migrateToDaily(id, content, bulletType, today)}
                    onScheduleToFuture={entry.sourceId ? undefined : scheduleToFuture}
                  />
                  <div className="pl-8 pb-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <input
                      type="date"
                      className="text-[10px] font-mono bg-transparent text-zinc-500 border-none outline-none"
                      value={entry.scheduledDate ?? ''}
                      onChange={e => setScheduledDate(entry.id, e.target.value || undefined)}
                      title="날짜 변경"
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
            <select
              className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
              value={composerMonth}
              onChange={e => { setComposerMonth(Number(e.target.value)); setComposerDay('') }}
            >
              {MONTHS_KO.map((label, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-surface-1">{label}</option>
              ))}
            </select>
            <span className="text-zinc-700">·</span>
            <select
              className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
              value={composerDay}
              onChange={e => setComposerDay(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="" className="bg-surface-1">일 선택 안함</option>
              {Array.from({ length: daysInMonth(activeYear, composerMonth) }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} className="bg-surface-1">{d}일</option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  )
}
