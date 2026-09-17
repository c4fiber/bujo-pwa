import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { subDays } from 'date-fns'
import { useDailyFeed } from '../../../hooks/useDailyFeed'
import { useUIStore } from '../../../store/uiStore'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { formatDisplay, toDateString } from '../../../utils/dateUtils'
import type { DailyEntry } from '../../../types/journal'

const PAGE_DAYS = 14

export function DailyLogView() {
  const [daysBack, setDaysBack] = useState(PAGE_DAYS)
  const { entries, earliestDate, addEntry, updateStatus, updateContent, deleteEntry, moveToDate } = useDailyFeed(daysBack)
  const today = toDateString(new Date())
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [composerDate, setComposerDate] = useState(today)
  const dailyHome = useUIStore(s => s.dailyHome)

  // 현재 로드 범위의 시작일. 이보다 오래된 실데이터가 있으면 더 로드 가능
  const windowStart = toDateString(subDays(new Date(), daysBack))
  const hasMore = !!earliestDate && windowStart > earliestDate

  // 무한 스크롤: 하단 sentinel이 보이면 범위를 넓힌다
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setDaysBack(d => d + PAGE_DAYS)
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, entries.length])

  // 하단 Daily 탭 재터치 시 오늘 날짜로 스크롤
  useEffect(() => {
    if (dailyHome === 0) return
    setComposerDate(today)
    rowRefs.current[today]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [dailyHome, today])

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

  return (
    <div className="flex flex-col h-full">
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

              </div>
            </div>
          )
        })}

        {/* 무한 스크롤 sentinel */}
        <div ref={sentinelRef} className="p-4 text-center">
          {hasMore ? (
            <span className="text-xs font-mono text-zinc-600 animate-pulse">이전 날짜 불러오는 중…</span>
          ) : (
            <span className="text-xs font-mono text-zinc-700">처음까지 모두 봤어요</span>
          )}
        </div>
      </div>

      {/* 단일 입력창 — 기본값 오늘, 필요 시 날짜 지정 */}
      <EntryComposer
        onAdd={(content, bulletType) => addEntry(content, bulletType, composerDate)}
        placeholder={composerDate === today ? '오늘의 항목 입력…' : '항목 입력…'}
        extraFields={
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>날짜:</span>
            <input
              type="date"
              className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
              value={composerDate}
              onChange={e => setComposerDate(e.target.value || today)}
            />
            {composerDate !== today && (
              <button
                onClick={() => setComposerDate(today)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-zinc-400 hover:text-white transition-colors"
              >
                오늘로
              </button>
            )}
          </div>
        }
      />
    </div>
  )
}
