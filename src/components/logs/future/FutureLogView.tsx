import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useFutureLog } from '../../../hooks/useFutureLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { MONTHS_KO } from '../../../utils/dateUtils'
import type { BulletType } from '../../../types/journal'

export function FutureLogView() {
  const { activeYear, setActiveYear } = useUIStore()
  const { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly } = useFutureLog(activeYear)
  const [openMonths, setOpenMonths] = useState<number[]>([new Date().getMonth() + 1])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const toggle = (m: number) =>
    setOpenMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const handleAdd = (content: string, bulletType: BulletType) => {
    addEntry(content, bulletType, selectedMonth)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Year nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={() => setActiveYear(activeYear - 1)} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <span className="text-sm text-zinc-300 font-mono">{activeYear}년 Future Log</span>
        <button onClick={() => setActiveYear(activeYear + 1)} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      {/* Month accordion */}
      <div className="flex-1 overflow-y-auto">
        {MONTHS_KO.map((label, idx) => {
          const month = idx + 1
          const monthEntries = entries.filter(e => e.month === month)
          const isOpen = openMonths.includes(month)

          return (
            <div key={month} className="border-b border-surface-2">
              <button
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-surface-2 transition-colors"
                onClick={() => { toggle(month); setSelectedMonth(month) }}
              >
                <span className="text-sm font-mono text-zinc-300">{label}</span>
                <div className="flex items-center gap-2">
                  {monthEntries.length > 0 && (
                    <span className="text-[10px] text-zinc-600">{monthEntries.length}개</span>
                  )}
                  <span className="text-zinc-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-2 space-y-1">
                      {monthEntries.length === 0 && (
                        <p className="text-xs text-zinc-700 py-2 pl-1">항목 없음</p>
                      )}
                      <AnimatePresence initial={false}>
                        {monthEntries.map(entry => (
                          <EntryItem
                            key={entry.id}
                            entry={entry}
                            origin="manual"
                            onStatusChange={updateStatus}
                            onContentChange={updateContent}
                            onDelete={deleteEntry}
                            onScheduleToMonthlyFromFuture={(id, content, bulletType, y, m, d) => scheduleToMonthly(id, content, bulletType, y, m, d)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <EntryComposer
        onAdd={handleAdd}
        placeholder={`${MONTHS_KO[selectedMonth - 1]} 항목 입력…`}
        extraFields={
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>월:</span>
            <select
              className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_KO.map((label, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-surface-1">{label}</option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  )
}
