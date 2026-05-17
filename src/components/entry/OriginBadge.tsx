import type { EntryOrigin } from '../../types/journal'

export function OriginBadge({ origin }: { origin: EntryOrigin }) {
  if (origin === 'from-monthly') {
    return (
      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-900/40 text-accent-blue leading-none">
        M
      </span>
    )
  }
  if (origin === 'from-future') {
    return (
      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-green-900/40 text-accent-green leading-none">
        F
      </span>
    )
  }
  return null
}
