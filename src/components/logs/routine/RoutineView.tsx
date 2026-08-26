import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '../../../store/uiStore'
import { useRoutines } from '../../../hooks/useRoutines'
import { formatMonthDisplay, nextMonth, prevMonth, toDateString } from '../../../utils/dateUtils'
import type { RoutineDayStatus } from '../../../types/journal'

const pad = (n: number) => String(n).padStart(2, '0')
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 다음 상태로 순환: none → success → fail → none
function nextStatus(cur: RoutineDayStatus | undefined): RoutineDayStatus | null {
  if (!cur) return 'success'
  if (cur === 'success') return 'fail'
  return null
}

export function RoutineView() {
  const { activeYear, activeMonth, setActiveYear, setActiveMonth } = useUIStore()
  const { routines, logs, addRoutine, renameRoutine, deleteRoutine, setStatus } = useRoutines(activeYear, activeMonth)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const today = toDateString(new Date())
  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate()
  const firstWeekday = new Date(activeYear, activeMonth - 1, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const goPrev = () => { const { year, month } = prevMonth(activeYear, activeMonth); setActiveYear(year); setActiveMonth(month) }
  const goNext = () => { const { year, month } = nextMonth(activeYear, activeMonth); setActiveYear(year); setActiveMonth(month) }

  const dateOf = (day: number) => `${activeYear}-${pad(activeMonth)}-${pad(day)}`
  const isFuture = (day: number) => dateOf(day) > today

  const cellClass = (status: RoutineDayStatus | undefined, future: boolean) => {
    if (future) return 'bg-surface-2/40 cursor-not-allowed'
    if (status === 'success') return 'bg-accent-green hover:brightness-110'
    if (status === 'fail') return 'bg-red-500 hover:brightness-110'
    return 'bg-surface-3 hover:bg-surface-3/70'
  }

  const stats = (routineId: string) => {
    let success = 0, reachable = 0
    for (const day of days) {
      if (isFuture(day)) continue
      reachable++
      if (logs[`${routineId}_${dateOf(day)}`] === 'success') success++
    }
    const rate = reachable === 0 ? 0 : Math.round((success / reachable) * 100)
    return { success, reachable, rate }
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    addRoutine(newName)
    setNewName('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <button onClick={goPrev} className="text-zinc-500 hover:text-white text-lg px-2">‹</button>
        <span className="text-sm text-zinc-300 font-mono">{formatMonthDisplay(activeYear, activeMonth)} Routine</span>
        <button onClick={goNext} className="text-zinc-500 hover:text-white text-lg px-2">›</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {routines.length === 0 && (
          <p className="text-center text-zinc-700 text-sm mt-12">추적할 루틴을 추가하세요</p>
        )}

        {routines.map(routine => {
          const { success, reachable, rate } = stats(routine.id)
          return (
            <motion.div
              key={routine.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-1 rounded-xl p-3 border border-surface-2"
            >
              {/* 헤더: 이름 + 달성률 + 삭제 */}
              <div className="flex items-center justify-between mb-2 gap-2">
                {editingId === routine.id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-white outline-none border-b border-surface-3"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => { renameRoutine(routine.id, editName); setEditingId(null) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { renameRoutine(routine.id, editName); setEditingId(null) }
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span
                    className="text-sm text-white font-medium cursor-text truncate"
                    onDoubleClick={() => { setEditingId(routine.id); setEditName(routine.name) }}
                  >
                    {routine.name}
                  </span>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-accent-green">{rate}%</span>
                  <span className="text-[10px] font-mono text-zinc-600">{success}/{reachable}</span>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors"
                    aria-label="delete routine"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 잔디 그리드 (요일 정렬) */}
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(w => (
                  <div key={w} className="text-center text-[9px] font-mono text-zinc-600">{w}</div>
                ))}
                {Array.from({ length: firstWeekday }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map(day => {
                  const date = dateOf(day)
                  const status = logs[`${routine.id}_${date}`]
                  const future = isFuture(day)
                  return (
                    <button
                      key={day}
                      disabled={future}
                      onClick={() => setStatus(routine.id, date, nextStatus(status))}
                      title={`${activeMonth}/${day}${status ? ` — ${status === 'success' ? '성공' : '실패'}` : ''}`}
                      className={`aspect-square rounded-sm flex items-center justify-center text-[9px] font-mono transition-colors ${cellClass(status, future)} ${
                        status ? 'text-white/80' : 'text-zinc-500'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 루틴 추가 */}
      <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 flex items-center gap-2">
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          placeholder="새 루틴 이름…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd() }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1"
        >
          추가
        </button>
      </div>
    </div>
  )
}
