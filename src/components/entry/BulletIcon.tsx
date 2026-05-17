import type { BulletType, EntryOrigin, TaskStatus } from '../../types/journal'

interface Props {
  bulletType: BulletType
  taskStatus?: TaskStatus
  origin?: EntryOrigin
  deferred?: boolean
  onClick?: () => void
}

export function BulletIcon({ bulletType, taskStatus, origin, deferred, onClick }: Props) {
  const base = 'w-5 h-5 flex items-center justify-center text-sm select-none'

  if (bulletType === 'task') {
    if (origin === 'migrated') {
      const icon = taskStatus === 'completed' ? '✕' : taskStatus === 'cancelled' ? '•' : '>'
      const color = taskStatus === 'cancelled' ? 'text-zinc-600' : taskStatus === 'completed' ? 'text-zinc-500' : 'text-accent-amber'
      return (
        <button
          className={`${base} font-mono ${color} hover:text-white transition-colors`}
          onClick={onClick}
          aria-label="migrated task"
        >
          {icon}
        </button>
      )
    }

    const icon =
      taskStatus === 'completed' ? '✕' :
      taskStatus === 'migrated'  ? '>' :
      (taskStatus === 'scheduled' || deferred) ? '<' : '•'

    const color = (taskStatus === 'scheduled' || deferred) ? 'text-accent-amber' : 'text-zinc-400'

    return (
      <button
        className={`${base} font-mono ${color} hover:text-white transition-colors`}
        onClick={onClick}
        aria-label="task status"
      >
        {icon}
      </button>
    )
  }

  // event: Google Calendar 연동 예정 — accent-blue로 구분
  if (bulletType === 'event') {
    return <span className={`${base} text-accent-blue`}>○</span>
  }

  return <span className={`${base} text-zinc-500`}>–</span>
}
