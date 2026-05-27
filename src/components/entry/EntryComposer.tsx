import { useRef, useState } from 'react'
import type { BulletType } from '../../types/journal'

interface Props {
  onAdd: (content: string, bulletType: BulletType) => void
  placeholder?: string
  extraFields?: React.ReactNode
}

const BULLET_OPTIONS: { type: BulletType; label: string; icon: string }[] = [
  { type: 'task', label: '할일', icon: '•' },
  { type: 'event', label: '이벤트', icon: '○' },
  { type: 'note', label: '노트', icon: '–' },
]

export function EntryComposer({ onAdd, placeholder = '내용 입력…', extraFields }: Props) {
  const [content, setContent] = useState('')
  const [bulletType, setBulletType] = useState<BulletType>('task')
  const composingRef = useRef(false)

  const submit = () => {
    const trimmed = content.trim()
    if (!trimmed || composingRef.current) return
    onAdd(trimmed, bulletType)
    setContent('')
  }

  return (
    <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 space-y-2">
      {extraFields}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {BULLET_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setBulletType(opt.type)}
              className={`w-7 h-7 rounded font-mono text-sm transition-colors ${
                bulletType === opt.type
                  ? 'bg-surface-3 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          placeholder={placeholder}
          value={content}
          onChange={e => setContent(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composingRef.current && !e.nativeEvent.isComposing) {
              submit()
            }
          }}
        />
        <button
          onMouseDown={e => {
            e.preventDefault()
            submit()
          }}
          onTouchEnd={e => {
            e.preventDefault()
            submit()
          }}
          disabled={!content.trim()}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1"
        >
          추가
        </button>
      </div>
    </div>
  )
}
