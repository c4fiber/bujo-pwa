import { useState } from 'react'
import { motion } from 'framer-motion'
import type { BulletType, DailyEntry, MonthlyEntry, FutureEntry, TaskStatus, EntryOrigin } from '../../types/journal'
import { BulletIcon } from './BulletIcon'
import { OriginBadge } from './OriginBadge'
import { DelayDialog } from './DelayDialog'
import { ScheduleToFutureDialog } from './ScheduleToFutureDialog'

type AnyEntry = DailyEntry | MonthlyEntry | FutureEntry

interface Props {
  entry: AnyEntry
  origin?: EntryOrigin
  onStatusChange?: (id: string, status: TaskStatus) => void
  onContentChange?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  onDelay?: (id: string, content: string, targetDate: string) => void
  onUndoDelay?: (id: string, delayedMonthlyId?: string) => void
  onScheduleToFuture?: (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number) => void
  readOnly?: boolean
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
  onStatusChange, onContentChange, onDelete, onDelay, onUndoDelay, onScheduleToFuture, readOnly,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const [delayOpen, setDelayOpen] = useState(false)
  const [scheduleToFutureOpen, setScheduleToFutureOpen] = useState(false)

  const isDelayed = !!(entry as DailyEntry).delayedMonthlyId
  const canDelay = !!onDelay && entry.bulletType === 'task' && !isDelayed
  const canScheduleToFuture = !!onScheduleToFuture && entry.bulletType === 'task'

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

  const handleBulletClick = () => {
    if (isDelayed && onUndoDelay) {
      onUndoDelay(entry.id, (entry as DailyEntry).delayedMonthlyId)
    } else {
      cycleStatus()
    }
  }

  const commitEdit = () => {
    setEditing(false)
    if (draft.trim() && draft !== entry.content) {
      onContentChange?.(entry.id, draft.trim())
    } else {
      setDraft(entry.content)
    }
  }

  const hasStrikethrough = entry.taskStatus === 'completed' || entry.taskStatus === 'cancelled'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15 }}
      className={`flex items-start gap-2 px-3 py-2 border-l-2 ${
        entry.bulletType === 'event' ? 'border-l-accent-blue bg-blue-950/10' : `${borderColor[origin]} ${bgColor[origin]}`
      } rounded-r group`}
    >
      <BulletIcon
        bulletType={entry.bulletType}
        taskStatus={entry.taskStatus}
        origin={origin}
        deferred={isDelayed}
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
        {canDelay && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-amber text-xs px-1 font-mono"
            onClick={() => setDelayOpen(true)}
            aria-label="delay"
          >
            &lt;
          </button>
        )}
        {canScheduleToFuture && (
          <button
            className="opacity-40 hover:opacity-100 active:opacity-100 transition-opacity text-zinc-600 hover:text-accent-amber text-xs px-1 font-mono"
            onClick={() => setScheduleToFutureOpen(true)}
            aria-label="schedule to future"
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

      {canDelay && (
        <DelayDialog
          open={delayOpen}
          onConfirm={targetDate => onDelay(entry.id, entry.content, targetDate)}
          onClose={() => setDelayOpen(false)}
        />
      )}
      {canScheduleToFuture && (
        <ScheduleToFutureDialog
          open={scheduleToFutureOpen}
          onConfirm={(targetYear, targetMonth) => onScheduleToFuture(entry.id, entry.content, entry.bulletType, targetYear, targetMonth)}
          onClose={() => setScheduleToFutureOpen(false)}
        />
      )}
    </motion.div>
  )
}
