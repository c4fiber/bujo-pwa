import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useFutureLog } from '../../../hooks/useFutureLog'
import { EntryItem } from '../../entry/EntryItem'
import { EntryComposer } from '../../entry/EntryComposer'
import { MONTHS_KO } from '../../../utils/dateUtils'
import type { BulletType } from '../../../types/journal'

export function FutureLogView() {
  const { activeYear, setActiveYear } = useUIStore()
  const { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToDaily } = useFutureLog(activeYear)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

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

      {/* Month accordion — 넓은 화면(fold+)에서는 2단 그리드 */}
      <div className="flex-1 overflow-y-auto fold:grid fold:grid-cols-2 fold:content-start fold:gap-x-4 fold:px-2">
        {MONTHS_KO.map((label, idx) => {
          const month = idx + 1
          const monthEntries = entries.filter(e => e.month === month)
          const isSelected = selectedMonth === month

          return (
            <div key={month} className="border-b border-surface-2">
              {/* 월 구분 헤더 (토글 없음). 탭하면 입력 대상 월로 지정 */}
              <button
                className={`w-full flex items-center justify-between px-4 py-2 hover:bg-surface-2 transition-colors ${
                  isSelected ? 'bg-surface-1' : ''
                }`}
                onClick={() => setSelectedMonth(month)}
              >
                <span className={`text-sm font-mono ${isSelected ? 'text-accent-blue' : 'text-zinc-300'}`}>{label}</span>
                {monthEntries.length > 0 && (
                  <span className="text-[10px] text-zinc-600">{monthEntries.length}개</span>
                )}
              </button>

              <div className="px-3 pb-2 space-y-1">
                {monthEntries.length === 0 && (
                  <p className="text-xs text-zinc-700 py-1 pl-1">항목 없음</p>
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
                      onScheduleToDaily={scheduleToDaily}
                    />
                  ))}
                </AnimatePresence>
              </div>
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
