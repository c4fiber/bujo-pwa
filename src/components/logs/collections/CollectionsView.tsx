import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { useCollections, useCollectionItems, normalizeStatus, nextCollectionStatus } from '../../../hooks/useCollections'
import { DelayDialog } from '../../entry/DelayDialog'
import type { CollectionItem, CollectionItemStatus } from '../../../types/journal'

const STATUS_META: Record<CollectionItemStatus, { icon: string; color: string; label: string }> = {
  open:        { icon: '○', color: 'text-zinc-500', label: '대기' },
  in_progress: { icon: '◐', color: 'text-accent-amber', label: '진행중' },
  done:        { icon: '✓', color: 'text-accent-green', label: '완료' },
}

export function CollectionsView() {
  const { collections, addCollection, renameCollection, deleteCollection, countsByCollection } = useCollections()
  const [openId, setOpenId] = useState<string | null>(null)
  const [newCol, setNewCol] = useState('')

  const handleAddCollection = async () => {
    if (!newCol.trim()) return
    const id = await addCollection(newCol)
    setNewCol('')
    if (id) setOpenId(id)
  }

  const open = collections.find(c => c.id === openId) ?? null

  if (open) {
    return (
      <CollectionDetail
        collectionId={open.id}
        name={open.name}
        onBack={() => setOpenId(null)}
        onRename={name => renameCollection(open.id, name)}
        onDelete={() => { deleteCollection(open.id); setOpenId(null) }}
      />
    )
  }

  // ── 전체 개요: 업무/고객사가 한눈에 보이는 세로 리스트 ──
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-2">
        <span className="text-sm font-mono text-zinc-300">Lists</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {collections.length === 0 && (
          <p className="text-center text-zinc-600 text-sm leading-relaxed mt-12">
            업무·고객사를 추가하고<br />진행 상황을 한눈에 확인하세요.
          </p>
        )}
        {collections.map(c => {
          const { total, open: openCount, inProgress, done } = countsByCollection(c.id)
          return (
            <button
              key={c.id}
              onClick={() => setOpenId(c.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-1 border border-surface-2 hover:border-surface-3 transition-colors text-left"
            >
              <span className="text-sm text-white font-medium truncate">{c.name}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {inProgress > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber">
                    진행중 {inProgress}
                  </span>
                )}
                {openCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-zinc-400">
                    대기 {openCount}
                  </span>
                )}
                {total === 0 && (
                  <span className="text-[10px] font-mono text-zinc-700">비어있음</span>
                )}
                {total > 0 && inProgress === 0 && openCount === 0 && (
                  <span className="text-[10px] font-mono text-accent-green">전체 완료 ({done})</span>
                )}
              </div>
            </button>
          )
        })}
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

function CollectionDetail({
  collectionId, name, onBack, onRename, onDelete,
}: {
  collectionId: string
  name: string
  onBack: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const { items, addItem, setStatus, updateItem, deleteItem, scheduleToDaily } = useCollectionItems(collectionId)
  const [newItem, setNewItem] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(name)

  const active = items.filter(i => normalizeStatus(i) !== 'done')
  const done = items.filter(i => normalizeStatus(i) === 'done')

  const handleAddItem = () => {
    if (!newItem.trim()) return
    addItem(newItem)
    setNewItem('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="text-zinc-500 hover:text-white text-lg px-1 shrink-0">‹</button>
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
              onDoubleClick={() => { setEditingName(true); setEditName(name) }}
            >
              {name}
            </span>
          )}
        </div>
        <button
          onClick={() => { if (confirm(`'${name}' 목록을 삭제할까요?`)) onDelete() }}
          className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors shrink-0"
          aria-label="delete collection"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence initial={false}>
          {active.map(item => (
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
        {active.length === 0 && done.length === 0 && (
          <p className="text-center text-zinc-700 text-sm mt-10">항목을 추가하세요</p>
        )}

        {/* 완료 항목은 접어서 깔끔하게 유지 */}
        {done.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowDone(s => !s)}
              className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 px-1 py-1 transition-colors"
            >
              {showDone ? '▲' : '▼'} 완료 {done.length}개
            </button>
            <AnimatePresence initial={false}>
              {showDone && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden space-y-1"
                >
                  {done.map(item => (
                    <CollectionItemRow
                      key={item.id}
                      item={item}
                      onCycleStatus={() => setStatus(item.id, nextCollectionStatus(normalizeStatus(item)))}
                      onEdit={content => updateItem(item.id, content)}
                      onDelete={() => deleteItem(item.id)}
                      onSchedule={date => scheduleToDaily(item.content, date)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 flex items-center gap-2">
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          placeholder="항목 추가…"
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
      className="flex items-center gap-2 px-3 py-2 rounded bg-surface-1 border-l-2 border-l-surface-3 group"
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
      {/* 📅 Daily로 편성 */}
      <button
        onClick={() => setScheduleOpen(true)}
        className="text-accent-blue/80 hover:text-accent-blue hover:bg-accent-blue/15 text-xs px-1.5 py-0.5 rounded transition-colors shrink-0"
        title="날짜 정해 Daily로 편성"
      >
        📅
      </button>
      <button
        onClick={onDelete}
        className="opacity-40 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1 transition-all shrink-0"
        aria-label="delete"
      >
        ✕
      </button>

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
