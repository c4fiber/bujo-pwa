import { useState } from 'react'
import { motion } from 'framer-motion'
import type { BulletType, DailyEntry, FutureEntry, TaskStatus, EntryOrigin } from '../../types/journal'
import { BulletIcon } from './BulletIcon'
import { OriginBadge } from './OriginBadge'
import { DelayDialog } from './DelayDialog'
import { EntryActionButton } from './EntryActionButton'
import { format } from 'date-fns'

type AnyEntry = DailyEntry | FutureEntry

interface Props {
  entry: AnyEntry
  origin?: EntryOrigin
  onStatusChange?: (id: string, status: TaskStatus) => void
  onContentChange?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  // Daily 항목을 다른 날짜로 이동 (캘린더)
  onMoveToDate?: (id: string, content: string, bulletType: BulletType, targetDate: string) => void
  // Future 항목을 특정 날짜의 Daily로 편성 (캘린더)
  onScheduleToDaily?: (id: string, content: string, bulletType: BulletType, targetDate: string) => void
  readOnly?: boolean
  // 대량 목록(Review 등)에서 framer-motion layout projection 이슈를 피하기 위해 애니메이션을 끈다.
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
  onMoveToDate, onScheduleToDaily,
  readOnly, disableMotion,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const [moveOpen, setMoveOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const canMove = !!onMoveToDate && entry.bulletType === 'task'
  const canSchedule = !!onScheduleToDaily && entry.bulletType === 'task'
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')

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
        onClick={cycleStatus}
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
        {/* Future → Daily 편성 (캘린더) */}
        {canSchedule && (
          <EntryActionButton color="green" title="Daily로 편성 (날짜 선택)" onClick={() => setScheduleOpen(true)}>
            📅
          </EntryActionButton>
        )}
        {/* Daily 항목 다른 날짜로 이동 (캘린더) */}
        {canMove && (
          <EntryActionButton color="amber" title="다른 날짜로 이동 (캘린더)" onClick={() => setMoveOpen(true)}>
            📅
          </EntryActionButton>
        )}
        {onDelete && (
          <EntryActionButton color="red" title="삭제" ariaLabel="delete" onClick={() => onDelete(entry.id)}>
            ✕
          </EntryActionButton>
        )}
      </div>

      {canMove && (
        <DelayDialog
          open={moveOpen}
          onConfirm={targetDate => onMoveToDate!(entry.id, entry.content, entry.bulletType, targetDate)}
          onClose={() => setMoveOpen(false)}
          title="MOVE TO DATE"
          description="이 항목을 옮길 날짜를 선택하세요"
          confirmLabel="이동"
        />
      )}
      {canSchedule && (
        <DelayDialog
          open={scheduleOpen}
          onConfirm={targetDate => onScheduleToDaily!(entry.id, entry.content, entry.bulletType, targetDate)}
          onClose={() => setScheduleOpen(false)}
          title="SCHEDULE TO DAILY"
          description="Daily Log에 편성할 날짜를 선택하세요"
          confirmLabel="편성"
          defaultDate={tomorrow}
        />
      )}
    </motion.div>
  )
}
