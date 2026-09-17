import { useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useDailyFeed } from '../../../hooks/useDailyFeed'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { formatDisplay, toDateString } from '../../../utils/dateUtils'
import type { DailyEntry } from '../../../types/journal'
import { differenceInCalendarDays, parseISO } from 'date-fns'

const PAGE_DAYS = 14

export function DailyLogView() {
  const [daysBack, setDaysBack] = useState(PAGE_DAYS)
  const { entries, addEntry, updateStatus, updateContent, deleteEntry, moveToDate } = useDailyFeed(daysBack)
  const today = toDateString(new Date())
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 날짜별 그룹핑
  const byDate = useMemo(() => {
    const map = new Map<string, DailyEntry[]>()
    for (const e of entries) {
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return map
  }, [entries])

  // 오늘은 비어 있어도 항상 표시. 날짜 내림차순(미래→오늘→과거)
  const dates = useMemo(() => {
    const set = new Set(byDate.keys())
    set.add(today)
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [byDate, today])

  const jumpTo = (date: string) => {
    if (!date) return
    const back = differenceInCalendarDays(new Date(), parseISO(date))
    if (back > daysBack) setDaysBack(back + PAGE_DAYS)
    setTimeout(() => rowRefs.current[date]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더: 제목 + 날짜 점프 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <span className="text-sm text-zinc-300 font-mono">Daily Log</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => jumpTo(today)}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-zinc-400 hover:text-white transition-colors"
          >
            오늘
          </button>
          <label className="relative cursor-pointer text-accent-blue hover:text-accent-blue/80" title="날짜로 이동">
            <span className="text-sm">📅</span>
            <input
              type="date"
              onChange={e => jumpTo(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* 피드 */}
      <div className="flex-1 overflow-y-auto">
        {dates.map(date => {
          const dayEntries = byDate.get(date) ?? []
          const active = dayEntries.filter(e => e.origin !== 'migrated')
          const migrated = dayEntries.filter(e => e.origin === 'migrated')
          const isToday = date === today
          const tasks = active.filter(e => e.bulletType === 'task')
          const openCount = tasks.filter(e => (e.taskStatus ?? 'open') === 'open').length
          const hasTasks = tasks.length > 0
          const allDone = hasTasks && openCount === 0

          return (
            <div
              key={date}
              ref={el => { rowRefs.current[date] = el }}
              className="border-b border-surface-2"
            >
              {/* 날짜 구분 헤더 (토글 없음) */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-surface-1' : ''}`}>
                <div className="flex items-center gap-2">
                  {/* 완료 인디케이터: 미완료 있으면 amber 점, 전체 완료면 green 체크 */}
                  {hasTasks && (
                    <span
                      className={`text-xs leading-none ${allDone ? 'text-accent-green' : 'text-accent-amber'}`}
                      title={allDone ? '전체 완료' : `미완료 ${openCount}개`}
                    >
                      {allDone ? '✓' : '●'}
                    </span>
                  )}
                  <span className={`text-sm font-mono ${isToday ? 'text-accent-blue' : 'text-zinc-300'}`}>
                    {formatDisplay(date)}{isToday && ' · 오늘'}
                  </span>
                </div>
                {hasTasks && (
                  <span className="text-[10px] font-mono text-zinc-600">
                    {tasks.length - openCount}/{tasks.length}
                  </span>
                )}
              </div>

              {/* 항목 (항상 펼침) */}
              <div className="px-3 pb-2 space-y-1">
                <AnimatePresence initial={false}>
                  {active.map(entry => (
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

                {migrated.length > 0 && (
                  <>
                    <div className="text-[10px] text-accent-amber/60 font-mono px-1 pt-2 pb-0.5 flex items-center gap-1">
                      <span>📅</span><span>이동됨</span>
                    </div>
                    {migrated.map(entry => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        origin="migrated"
                        onStatusChange={updateStatus}
                        onDelete={deleteEntry}
                        readOnly
                        disableMotion
                      />
                    ))}
                  </>
                )}

                {/* 해당 날짜에 바로 추가 */}
                <div className="pt-1">
                  <EntryComposer
                    onAdd={(content, bulletType) => addEntry(content, bulletType, date)}
                    placeholder={isToday ? '오늘의 항목 입력…' : '이 날짜에 추가…'}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* 페이징 */}
        <div className="p-4 text-center">
          <button
            onClick={() => setDaysBack(d => d + PAGE_DAYS)}
            className="text-xs font-mono text-zinc-500 hover:text-white px-4 py-2 rounded-lg bg-surface-2 transition-colors"
          >
            이전 날짜 더 보기
          </button>
        </div>
      </div>
    </div>
  )
}
