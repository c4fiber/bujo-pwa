import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useInboxGroups, useInboxItems } from '../../../hooks/useInbox'
import { DelayDialog } from '../../entry/DelayDialog'
import { toDateString } from '../../../utils/dateUtils'
import { differenceInCalendarDays, parseISO, format } from 'date-fns'
import type { InboxItem } from '../../../types/journal'

// 기한 배지: D-day 계산 + 임박/초과 색
function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = differenceInCalendarDays(parseISO(deadline), new Date())
  let cls = 'bg-surface-2 text-zinc-400'
  if (days < 0) cls = 'bg-red-500/20 text-red-300'
  else if (days <= 3) cls = 'bg-red-500/20 text-red-300'
  else if (days <= 21) cls = 'bg-accent-amber/20 text-accent-amber'
  const label = days < 0 ? `D+${-days}` : days === 0 ? 'D-day' : `D-${days}`
  return <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
}

export function InboxView() {
  const { groups, addGroup, renameGroup, deleteGroup } = useInboxGroups()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newGroup, setNewGroup] = useState('')
  const [editingGroup, setEditingGroup] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (groups.length === 0) { setSelectedId(null); return }
    if (!selectedId || !groups.some(g => g.id === selectedId)) setSelectedId(groups[0].id)
  }, [groups, selectedId])

  const selected = groups.find(g => g.id === selectedId) ?? null
  const { items, addItem, updateContent, setDeadline, deleteItem, scheduleToDaily } = useInboxItems(selectedId)

  const [newItem, setNewItem] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const handleAddGroup = async () => {
    if (!newGroup.trim()) return
    const id = await addGroup(newGroup)
    setNewGroup('')
    if (id) setSelectedId(id)
  }

  const handleAddItem = () => {
    if (!newItem.trim()) return
    addItem(newItem, newDeadline || undefined)
    setNewItem(''); setNewDeadline('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* 그룹(업무/고객사) 칩 */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-surface-2 shrink-0">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedId(g.id)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              g.id === selectedId ? 'bg-surface-3 text-white' : 'bg-surface-2 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {g.name}
          </button>
        ))}
        <input
          className="w-28 shrink-0 bg-transparent text-xs text-white placeholder-zinc-600 outline-none px-2"
          placeholder="+ 업무/고객사"
          value={newGroup}
          onChange={e => setNewGroup(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddGroup() }}
        />
      </div>

      {groups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-center text-zinc-600 text-sm leading-relaxed">
            업무나 담당 고객사를 추가하고<br />
            날짜 미정 할 일을 담아두세요.<br />
            <span className="text-zinc-700 text-xs">나중에 📅로 날짜를 정하면 Daily로 이동합니다.</span>
          </p>
        </div>
      ) : (
        <>
          {selected && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-2">
              {editingGroup ? (
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white outline-none border-b border-surface-3"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => { renameGroup(selected.id, editName); setEditingGroup(false) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { renameGroup(selected.id, editName); setEditingGroup(false) }
                    if (e.key === 'Escape') setEditingGroup(false)
                  }}
                />
              ) : (
                <span
                  className="text-sm text-white font-medium cursor-text"
                  onDoubleClick={() => { setEditingGroup(true); setEditName(selected.name) }}
                >
                  {selected.name}
                </span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-zinc-600">{items.length}개</span>
                <button
                  onClick={() => { if (confirm(`'${selected.name}' 그룹을 삭제할까요?`)) deleteGroup(selected.id) }}
                  className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors"
                  aria-label="delete group"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <InboxItemRow
                  key={item.id}
                  item={item}
                  onEdit={content => updateContent(item.id, content)}
                  onSetDeadline={d => setDeadline(item.id, d)}
                  onDelete={() => deleteItem(item.id)}
                  onSchedule={date => scheduleToDaily(item, date)}
                />
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <p className="text-center text-zinc-700 text-sm mt-10">담아둘 할 일을 추가하세요</p>
            )}
          </div>

          {/* 항목 추가 (내용 + 선택적 기한) */}
          <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span>기한(선택):</span>
              <input
                type="date"
                className="bg-transparent text-zinc-400 outline-none font-mono text-xs"
                value={newDeadline}
                min={toDateString(new Date())}
                onChange={e => setNewDeadline(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                placeholder="담아둘 할 일…"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddItem() }}
              />
              <button
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1"
              >
                추가
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function InboxItemRow({
  item, onEdit, onSetDeadline, onDelete, onSchedule,
}: {
  item: InboxItem
  onEdit: (content: string) => void
  onSetDeadline: (d: string | undefined) => void
  onDelete: () => void
  onSchedule: (date: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.content)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft !== item.content) onEdit(draft.trim())
    else setDraft(item.content)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 px-3 py-2 rounded bg-surface-1 border-l-2 border-l-surface-3 group"
    >
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="w-full bg-transparent text-sm text-white outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setDraft(item.content); setEditing(false) }
            }}
          />
        ) : (
          <span
            className="text-sm break-words text-zinc-200 cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {item.content}
          </span>
        )}
      </div>

      {item.deadline && <DeadlineBadge deadline={item.deadline} />}

      <div className="flex items-center gap-1 shrink-0">
        {/* 📅 기한 지정/변경 */}
        <label className="relative cursor-pointer text-zinc-500 hover:text-accent-amber text-xs px-1" title="기한 설정">
          ⏰
          <input
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={item.deadline ?? ''}
            onChange={e => onSetDeadline(e.target.value || undefined)}
          />
        </label>
        {/* 📅 Daily로 편성 */}
        <button
          onClick={() => setScheduleOpen(true)}
          className="text-accent-blue/80 hover:text-accent-blue hover:bg-accent-blue/15 text-xs px-1.5 py-0.5 rounded transition-colors"
          title="날짜 정해 Daily로 이동"
        >
          📅
        </button>
        <button
          onClick={onDelete}
          className="opacity-40 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1 transition-all"
          aria-label="delete"
        >
          ✕
        </button>
      </div>

      <DelayDialog
        open={scheduleOpen}
        onConfirm={onSchedule}
        onClose={() => setScheduleOpen(false)}
        title="SCHEDULE TO DAILY"
        description="이 할 일을 처리할 날짜를 선택하세요"
        confirmLabel="Daily로 이동"
        defaultDate={item.deadline ?? tomorrow}
      />
    </motion.div>
  )
}
