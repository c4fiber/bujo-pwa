import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { firestore } from '../../../lib/firebase'
import { useAuthStore } from '../../../store/authStore'
import { useUIStore } from '../../../store/uiStore'
import { EntryItem } from '../../entry/EntryItem'
import { MONTHS_KO, formatDisplay } from '../../../utils/dateUtils'
import type { DailyEntry, TaskStatus } from '../../../types/journal'
import { doc, updateDoc } from 'firebase/firestore'

export function ReviewView() {
  const { uid, journalId } = useAuthStore()
  const { activeYear, setActiveYear } = useUIStore()
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const monthRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(firestore, `journals/${journalId}/dailyLogs`),
      where('year', '==', activeYear),
    )
    return onSnapshot(q, snap => {
      setEntries(
        snap.docs
          .map(d => d.data() as DailyEntry)
          .sort((a, b) => a.date.localeCompare(b.date))
      )
    })
  }, [uid, journalId, activeYear])

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      taskStatus,
    })
  }

  const jumpToMonth = (month: number) => {
    monthRefs.current[month]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // group by month
  const byMonth: Record<number, DailyEntry[]> = {}
  for (const e of entries) {
    if (!byMonth[e.month]) byMonth[e.month] = []
    byMonth[e.month].push(e)
  }

  // group each month's entries by date
  const groupByDate = (monthEntries: DailyEntry[]) => {
    const byDate: Record<string, DailyEntry[]> = {}
    for (const e of monthEntries) {
      if (!byDate[e.date]) byDate[e.date] = []
      byDate[e.date].push(e)
    }
    return byDate
  }

  const activeMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => byMonth[m])

  return (
    <div className="flex flex-col h-full">
      {/* Year nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={() => setActiveYear(activeYear - 1)} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <span className="text-sm text-zinc-300 font-mono">{activeYear}년 Review</span>
        <button onClick={() => setActiveYear(activeYear + 1)} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      {/* Month pills */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-surface-2 shrink-0">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
          <button
            key={m}
            onClick={() => jumpToMonth(m)}
            className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              byMonth[m] ? 'text-zinc-300 bg-surface-2 hover:bg-surface-3' : 'text-zinc-700'
            }`}
          >
            {MONTHS_KO[m - 1]}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {activeMonths.length === 0 && (
          <p className="text-center text-zinc-700 text-sm mt-12">{activeYear}년 기록 없음</p>
        )}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
          const monthEntries = byMonth[month]
          if (!monthEntries) return null
          const dateGroups = groupByDate(monthEntries)
          return (
            <div
              key={month}
              ref={el => { monthRefs.current[month] = el }}
              className="mb-2"
            >
              <div className="sticky top-0 bg-surface z-10 px-4 py-2 text-xs font-mono text-zinc-400 border-b border-surface-2">
                {MONTHS_KO[month - 1]}
                <span className="text-zinc-600 ml-2">{monthEntries.length}개</span>
              </div>
              {Object.entries(dateGroups).map(([date, dateEntries]) => (
                <div key={date} className="px-3 pt-2 pb-1">
                  <div className="text-[10px] font-mono text-zinc-600 mb-1 pl-1">
                    {formatDisplay(date)}
                  </div>
                  <div className="space-y-1">
                    {dateEntries.map(entry => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        origin={entry.origin}
                        onStatusChange={updateStatus}
                        disableMotion
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
