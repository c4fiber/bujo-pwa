export interface NavTab {
  to: string
  label: string
  icon: string
}

export const NAV_TABS: NavTab[] = [
  { to: '/future',   label: 'Future',   icon: '◎' },
  { to: '/daily',    label: 'Daily',    icon: '◦' },
  { to: '/routine',  label: 'Routine',  icon: '▦' },
  { to: '/review',   label: 'Review',   icon: '≡' },
  { to: '/settings', label: 'Settings', icon: '⊙' },
]
