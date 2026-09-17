import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCollections, useCollectionItems } from '../../../hooks/useCollections'

export function CollectionsView() {
  const { collections, addCollection, renameCollection, deleteCollection } = useCollections()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newCol, setNewCol] = useState('')
  const [editingCol, setEditingCol] = useState(false)
  const [editColName, setEditColName] = useState('')

  // 선택된 컬렉션이 없거나 삭제되면 첫 번째로 대체
  useEffect(() => {
    if (collections.length === 0) { setSelectedId(null); return }
    if (!selectedId || !collections.some(c => c.id === selectedId)) {
      setSelectedId(collections[0].id)
    }
  }, [collections, selectedId])

  const selected = collections.find(c => c.id === selectedId) ?? null
  const { items, addItem, toggleItem, updateItem, deleteItem } = useCollectionItems(selectedId)
  const [newItem, setNewItem] = useState('')

  const handleAddCollection = async () => {
    if (!newCol.trim()) return
    const id = await addCollection(newCol)
    setNewCol('')
    if (id) setSelectedId(id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 컬렉션 탭(칩) */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-surface-2 shrink-0">
        {collections.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              c.id === selectedId ? 'bg-surface-3 text-white' : 'bg-surface-2 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {c.name}
          </button>
        ))}
        {/* 새 컬렉션 인라인 추가 */}
        <div className="flex items-center shrink-0">
          <input
            className="w-24 bg-transparent text-xs text-white placeholder-zinc-600 outline-none px-2"
            placeholder="+ 새 목록"
            value={newCol}
            onChange={e => setNewCol(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddCollection() }}
          />
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-center text-zinc-600 text-sm leading-relaxed">
            주제별 목록을 만들어보세요.<br />
            읽을 책 · 아이디어 · 위시리스트 · 장보기 …
          </p>
        </div>
      ) : (
        <>
          {/* 선택된 컬렉션 헤더 */}
          {selected && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-2">
              {editingCol ? (
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white outline-none border-b border-surface-3"
                  value={editColName}
                  onChange={e => setEditColName(e.target.value)}
                  onBlur={() => { renameCollection(selected.id, editColName); setEditingCol(false) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { renameCollection(selected.id, editColName); setEditingCol(false) }
                    if (e.key === 'Escape') setEditingCol(false)
                  }}
                />
              ) : (
                <span
                  className="text-sm text-white font-medium cursor-text"
                  onDoubleClick={() => { setEditingCol(true); setEditColName(selected.name) }}
                >
                  {selected.name}
                </span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-zinc-600">
                  {items.filter(i => i.checked).length}/{items.length}
                </span>
                <button
                  onClick={() => { if (confirm(`'${selected.name}' 목록을 삭제할까요?`)) deleteCollection(selected.id) }}
                  className="text-zinc-600 hover:text-red-400 text-xs px-1 transition-colors"
                  aria-label="delete collection"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 아이템 목록 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <CollectionItemRow
                  key={item.id}
                  content={item.content}
                  checked={item.checked}
                  onToggle={() => toggleItem(item.id, !item.checked)}
                  onEdit={content => updateItem(item.id, content)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <p className="text-center text-zinc-700 text-sm mt-10">항목을 추가하세요</p>
            )}
          </div>

          {/* 아이템 추가 */}
          <div className="border-t border-surface-2 bg-surface-1 px-3 py-2 flex items-center gap-2">
            <input
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
              placeholder="항목 추가…"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && newItem.trim()) {
                  addItem(newItem); setNewItem('')
                }
              }}
            />
            <button
              onClick={() => { if (newItem.trim()) { addItem(newItem); setNewItem('') } }}
              disabled={!newItem.trim()}
              className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors px-1"
            >
              추가
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CollectionItemRow({
  content, checked, onToggle, onEdit, onDelete,
}: {
  content: string
  checked: boolean
  onToggle: () => void
  onEdit: (content: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft !== content) onEdit(draft.trim())
    else setDraft(content)
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
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center text-[10px] transition-colors ${
          checked ? 'bg-accent-green border-accent-green text-white' : 'border-surface-3 text-transparent'
        }`}
      >
        ✓
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
              if (e.key === 'Escape') { setDraft(content); setEditing(false) }
            }}
          />
        ) : (
          <span
            className={`text-sm break-words cursor-text ${checked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}
            onDoubleClick={() => setEditing(true)}
          >
            {content}
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="opacity-40 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1 transition-all"
        aria-label="delete"
      >
        ✕
      </button>
    </motion.div>
  )
}
