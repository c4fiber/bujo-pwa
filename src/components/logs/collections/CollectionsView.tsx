import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { useCollections, useCollectionItems, normalizeStatus, nextCollectionStatus } from '../../../hooks/useCollections'
import { DelayDialog } from '../../entry/DelayDialog'
import { EntryActionButton } from '../../entry/EntryActionButton'
import type { Collection, CollectionItem, CollectionItemStatus } from '../../../types/journal'

const STATUS_META: Record<CollectionItemStatus, { icon: string; color: string; label: string }> = {
  open:        { icon: '○', color: 'text-zinc-500', label: '대기' },
  in_progress: { icon: '◐', color: 'text-accent-amber', label: '진행중' },
  done:        { icon: '✓', color: 'text-accent-green', label: '완료' },
}

export function CollectionsView() {
  const { collections, addCollection, renameCollection, deleteCollection, countsByCollection } = useCollections()
  const [newCol, setNewCol] = useState('')

  const handleAddCollection = () => {
    if (!newCol.trim()) return
    addCollection(newCol)
    setNewCol('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-2">
        <span className="text-sm font-mono text-zinc-300">Lists</span>
      </div>

      {/* 모든 업무/고객사를 항상 펼친 상태로 나열 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {collections.length === 0 && (
          <p className="text-center text-zinc-600 text-sm leading-relaxed mt-12">
            업무·고객사를 추가하고<br />진행 상황을 한눈에 확인하세요.
          </p>
        )}
        {collections.map(c => (
          <CollectionSection
            key={c.id}
            collection={c}
            counts={countsByCollection(c.id)}
            onRename={name => renameCollection(c.id, name)}
            onDelete={() => { if (confirm(`'${c.name}' 목록을 삭제할까요?`)) deleteCollection(c.id) }}
          />
        ))}
      </div>

      {/* 새 업무/고객사 추가 */}
      <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 flex items-center gap-2">
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          placeholder="+ 새 업무/고객사"
          value={newCol}
          onChange={e => setNewCol(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddCollection() }}
        />
        <button
          onClick={handleAddCollection}
          disabled={!newCol.trim()}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1"
        >
          추가
        </button>
      </div>
    </div>
  )
}

function CollectionSection({
  collection, counts, onRename, onDelete,
}: {
  collection: Collection
  counts: { total: number; open: number; inProgress: number; done: number }
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const { items, addItem, setStatus, updateItem, deleteItem, scheduleToDaily } = useCollectionItems(collection.id)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(collection.name)
  const [addOpen, setAddOpen] = useState(false)
  const [newItem, setNewItem] = useState('')

  // 완료 항목도 삭제/숨김하지 않고 그대로 보여준다 — 정렬만 아래로
  const sorted = [
    ...items.filter(i => normalizeStatus(i) !== 'done'),
    ...items.filter(i => normalizeStatus(i) === 'done'),
  ]

  const handleAddItem = () => {
    if (!newItem.trim()) return
    addItem(newItem)
    setNewItem('')
  }

  return (
    <div className="rounded-xl bg-surface-1 border border-surface-2 overflow-hidden">
      {/* 헤더: 이름 + 진행 배지 + 항목추가 + 삭제 */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-2 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-white outline-none border-b border-surface-3"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => { onRename(editName); setEditingName(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { onRename(editName); setEditingName(false) }
                if (e.key === 'Escape') setEditingName(false)
              }}
            />
          ) : (
            <span
              className="text-sm text-white font-medium truncate cursor-text"
              onDoubleClick={() => { setEditingName(true); setEditName(collection.name) }}
            >
              {collection.name}
            </span>
          )}
          {counts.inProgress > 0 && (
            <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber">
              진행중 {counts.inProgress}
            </span>
          )}
          {counts.open > 0 && (
            <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-zinc-400">
              대기 {counts.open}
            </span>
          )}
          {counts.total > 0 && counts.inProgress === 0 && counts.open === 0 && (
            <span className="shrink-0 text-[10px] font-mono text-accent-green">완료 {counts.done}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <EntryActionButton color="blue" title="항목 추가" ariaLabel="add item" onClick={() => setAddOpen(o => !o)}>
            +
          </EntryActionButton>
          <button
            onClick={onDelete}
            className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors"
            aria-label="delete collection"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 헤더 '+' 로 열리는 인라인 항목 추가 */}
      <AnimatePresence initial={false}>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b border-surface-2"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                placeholder="항목 추가…"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) { handleAddItem() }
                  if (e.key === 'Escape') setAddOpen(false)
                }}
              />
              <button
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1 shrink-0"
              >
                추가
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 항목 목록 (항상 펼침) */}
      <div className="px-3 py-2 space-y-1">
        <AnimatePresence initial={false}>
          {sorted.map(item => (
            <CollectionItemRow
              key={item.id}
              item={item}
              onCycleStatus={() => setStatus(item.id, nextCollectionStatus(normalizeStatus(item)))}
              onEdit={content => updateItem(item.id, content)}
              onDelete={() => deleteItem(item.id)}
              onSchedule={date => scheduleToDaily(item.content, date)}
            />
          ))}
        </AnimatePresence>
        {sorted.length === 0 && (
          <p className="text-xs text-zinc-700 py-1 pl-1">항목 없음</p>
        )}
      </div>
    </div>
  )
}

function CollectionItemRow({
  item, onCycleStatus, onEdit, onDelete, onSchedule,
}: {
  item: CollectionItem
  onCycleStatus: () => void
  onEdit: (content: string) => void
  onDelete: () => void
  onSchedule: (date: string) => void
}) {
  const status = normalizeStatus(item)
  const meta = STATUS_META[status]
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
      className="flex items-center gap-2 px-3 py-2 rounded bg-surface-2/40 border-l-2 border-l-surface-3 group"
    >
      {/* 상태(대기→진행중→완료) 순환 버튼 */}
      <button
        onClick={onCycleStatus}
        title={meta.label}
        className={`w-5 h-5 shrink-0 flex items-center justify-center text-sm font-mono ${meta.color} hover:text-white transition-colors`}
      >
        {meta.icon}
      </button>
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
            className={`text-sm break-words cursor-text ${status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}
            onDoubleClick={() => setEditing(true)}
          >
            {item.content}
          </span>
        )}
      </div>
      {/* Daily와 동일한 액션 버튼: 📅 편성 / ✕ 삭제 (항상 보임) */}
      <div className="flex items-center gap-1 shrink-0">
        <EntryActionButton color="blue" title="날짜 정해 Daily로 편성" onClick={() => setScheduleOpen(true)}>
          📅
        </EntryActionButton>
        <EntryActionButton color="red" title="삭제" ariaLabel="delete" onClick={onDelete}>
          ✕
        </EntryActionButton>
      </div>

      <DelayDialog
        open={scheduleOpen}
        onConfirm={onSchedule}
        onClose={() => setScheduleOpen(false)}
        title="SCHEDULE TO DAILY"
        description="이 항목을 처리할 날짜를 선택하세요"
        confirmLabel="Daily로 편성"
        defaultDate={tomorrow}
      />
    </motion.div>
  )
}
