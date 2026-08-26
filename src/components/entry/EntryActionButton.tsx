import type { ReactNode } from 'react'

export type ActionColor = 'amber' | 'blue' | 'green' | 'red'

// 배경 pill + 진한 accent 텍스트로 항상 또렷하게 보이도록 통일한 스타일.
// (밀린 항목 / 일반 항목의 이동·삭제 버튼을 한 곳에서 관리)
const COLOR: Record<ActionColor, string> = {
  amber: 'bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/35 active:bg-accent-amber/45',
  blue:  'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/35 active:bg-accent-blue/45',
  green: 'bg-accent-green/20 text-accent-green hover:bg-accent-green/35 active:bg-accent-green/45',
  red:   'bg-red-500/20 text-red-300 hover:bg-red-500/35 active:bg-red-500/45',
}

interface Props {
  color: ActionColor
  title: string
  onClick: () => void
  children: ReactNode
  ariaLabel?: string
}

export function EntryActionButton({ color, title, onClick, children, ariaLabel }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`shrink-0 text-xs font-mono font-bold leading-none px-2 py-1 rounded transition-colors ${COLOR[color]}`}
    >
      {children}
    </button>
  )
}
