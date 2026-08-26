import { useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

const VIEW_LABELS: Record<string, string> = {
  '/daily': 'Daily Log',
  '/future': 'Future Log',
  '/routine': 'Routine',
  '/review': 'Review',
  '/settings': 'Settings',
}

export function TopBar() {
  const location = useLocation()
  const { activeYear } = useUIStore()
  const base = '/' + location.pathname.split('/')[1]
  const label = VIEW_LABELS[base] ?? 'BuJo'

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-surface-2 bg-surface-1">
      <span className="text-xs font-mono text-zinc-600">{activeYear}</span>
      <span className="text-sm font-mono text-white tracking-widest">{label}</span>
      <span className="text-xs font-mono text-zinc-600 w-8" />
    </header>
  )
}
