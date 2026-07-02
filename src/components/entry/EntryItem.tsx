import { useState } from 'react'
import { motion } from 'framer-motion'
import type { BulletType, DailyEntry, MonthlyEntry, FutureEntry, TaskStatus, EntryOrigin } from '../../types/journal'
import { BulletIcon } from './BulletIcon'
import { OriginBadge } from './OriginBadge'
import { DelayDialog } from './DelayDialog'
import { ScheduleToFutureDialog } from './ScheduleToFutureDialog'
import { ScheduleToMonthlyDialog } from './ScheduleToMonthlyDialog'

type AnyEntry = DailyEntry | MonthlyEntry | FutureEntry

interface Props {
  entry: AnyEntry
  origin?: EntryOrigin
  onStatusChange?: (id: string, status: TaskStatus) => void
  onContentChange?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  // < : Daily → Monthly (월+일 선택)
  onScheduleToMonthly?: (id: string, content: string, bulletType: BulletType, targetDate: string) => void
  // < : Monthly → Future (연+월 선택, 일 없음)
  onScheduleToFuture?: (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number) => void
  // > : Monthly → Daily (월+일 선택)
  onMigrateToDaily?: (id: string, content: string, bulletType: BulletType, targetDate: string) => void
  // > : Future → Monthly (연+월 선택, 선택적으로 일 지정)
  onScheduleToMonthlyFromFuture?: (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number, targetDay?: number) => void
  readOnly?: boolean
  // 대량 목록(Review 등)에서 framer-motion layout projection으로 인한
  // 초기 렌더 미표시 이슈를 피하기 위해 애니메이션을 끈다.
  disableMotion?: boolean
}

const MIGRATED_CYCLE: TaskStatus[] = ['open', 'completed', 'cancelled']
const STATUS_CYCLE: TaskStatus[] = ['open', 'completed']

const borderColor: Record<EntryOrigin, string> = {
  manual:         'border-l-surface-3',
  'from-monthly': 'border-l-accent-blue',
  'from-future':  'border-l-accent-green',
  migrated:       'border-l-accent-amber',
}

const bgColor: Record<EntryOrigin, string> = {
  manual:         '',
  'from-monthly': 'bg-blue-950/20',
  'from-future':  'bg-green-950/20',
  migrated:       'bg-amber-950/10',
}

export function EntryItem({
  entry, origin = 'manual',
  onStatusChange, onContentChange, onDelete,
  onScheduleToMonthly, onScheduleToFuture, onMigrateToDaily, onScheduleToMonthlyFromFuture,
  readOnly, disableMotion,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const [scheduleToMonthlyOpen, setScheduleToMonthlyOpen] = useState(false)
  const [scheduleToFutureOpen, setScheduleToFutureOpen] = useState(false)
  const [migrateToDailyOpen, setMigrateToDailyOpen] = useState(false)
  const [scheduleToMonthlyFromFutureOpen, setScheduleToMonthlyFromFutureOpen] = useState(false)

  const canScheduleToMonthly = !!onScheduleToMonthly && entry.bulletType === 'task'
  const canScheduleToFuture = !!onScheduleToFuture && entry.bulletType === 'task'
  const canMigrateToDaily = !!onMigrateToDaily && entry.bulletType === 'task'
  const canScheduleToMonthlyFromFuture = !!onScheduleToMonthlyFromFuture && entry.bulletType === 'task'

  const cycleStatus = () => {
    if (!onStatusChange || entry.bulletType !== 'task') return
    const cur = entry.taskStatus ?? 'open'
    if (origin === 'migrated') {
      const next = MIGRATED_CYCLE[(MIGRATED_CYCLE.indexOf(cur) + 1) % MIGRATED_CYCLE.length]
      onStatusChange(entry.id, next)
    } else {
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
      onStatusChange(entry.id, next)
    }
  }

  const handleBulletClick = () => cycleStatus()

  const commitEdit = () => {
    setEditing(false)
    if (draft.trim() && draft !== entry.content) {
      onContentChange?.(entry.id, draft.trim())
    } else {
      setDraft(entry.content)
    }
  }

  const hasStrikethrough = entry.taskStatus === 'completed' || entry.taskStatus === 'cancelled'

  const motionProps = disableMotion
    ? {}
    : {
        layout: true,
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.15 },
      }

  return (
    <motion.div
      {...motionProps}
      className={`flex items-start gap-2 px-3 py-2 border-l-2 ${
        entry.bulletType === 'event' ? 'border-l-accent-blue bg-blue-950/10' : `${borderColor[origin]} ${bgColor[origin]}`
      } rounded-r group`}
    >
      <BulletIcon
        bulletType={entry.bulletType}
        taskStatus={entry.taskStatus}
        origin={origin}
        deferred={false}
        onClick={handleBulletClick}
      />

      <div className="flex-1 min-w-0">
        {editing && !readOnly ? (
          <input
            autoFocus
            className="w-full bg-transparent text-sm text-white outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') { setDraft(entry.content); setEditing(false) }
            }}
          />
        ) : (
          <span
            className={`text-sm break-words ${
              hasStrikethrough ? 'line-through text-zinc-500' : 'text-zinc-200'
            } ${!readOnly ? 'cursor-text' : ''}`}
            onDoubleClick={() => !readOnly && setEditing(true)}
          >
            {entry.content}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <OriginBadge origin={origin} />
        {/* > : Monthly → Daily (월+일 선택) */}
        {canMigrateToDaily && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-amber text-xs px-1 font-mono"
            onClick={() => setMigrateToDailyOpen(true)}
            title="Daily로 이동 >"
          >
            &gt;
          </button>
        )}
        {/* > : Future → Monthly (연+월 선택) */}
        {canScheduleToMonthlyFromFuture && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-blue text-xs px-1 font-mono"
            onClick={() => setScheduleToMonthlyFromFutureOpen(true)}
            title="Monthly로 이동 >"
          >
            &gt;
          </button>
        )}
        {/* < : Daily → Monthly (월+일 선택) */}
        {canScheduleToMonthly && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-blue text-xs px-1 font-mono"
            onClick={() => setScheduleToMonthlyOpen(true)}
            title="Monthly로 예정 <"
          >
            &lt;
          </button>
        )}
        {/* < : Monthly → Future (연+월 선택) */}
        {canScheduleToFuture && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-green text-xs px-1 font-mono"
            onClick={() => setScheduleToFutureOpen(true)}
            title="Future로 예약 <"
          >
            &lt;
          </button>
        )}
        {onDelete && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 text-xs px-1"
            onClick={() => onDelete(entry.id)}
            aria-label="delete"
          >
            ✕
          </button>
        )}
      </div>

      {/* Daily → Monthly (월+일 선택) */}
      {canScheduleToMonthly && (
        <DelayDialog
          open={scheduleToMonthlyOpen}
          onConfirm={targetDate => onScheduleToMonthly(entry.id, entry.content, entry.bulletType, targetDate)}
          onClose={() => setScheduleToMonthlyOpen(false)}
        />
      )}
      {/* Monthly → Future (연+월 선택) */}
      {canScheduleToFuture && (
        <ScheduleToFutureDialog
          open={scheduleToFutureOpen}
          onConfirm={(y, m) => onScheduleToFuture(entry.id, entry.content, entry.bulletType, y, m)}
          onClose={() => setScheduleToFutureOpen(false)}
        />
      )}
      {/* Monthly → Daily (월+일 선택) */}
      {canMigrateToDaily && (
        <DelayDialog
          open={migrateToDailyOpen}
          onConfirm={targetDate => onMigrateToDaily(entry.id, entry.content, entry.bulletType, targetDate)}
          onClose={() => setMigrateToDailyOpen(false)}
        />
      )}
      {/* Future → Monthly (연+월+선택적 일 선택) */}
      {canScheduleToMonthlyFromFuture && (
        <ScheduleToMonthlyDialog
          open={scheduleToMonthlyFromFutureOpen}
          onConfirm={(y, m, d) => onScheduleToMonthlyFromFuture(entry.id, entry.content, entry.bulletType, y, m, d)}
          onClose={() => setScheduleToMonthlyFromFutureOpen(false)}
        />
      )}
    </motion.div>
  )
}
