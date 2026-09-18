import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where, getDocs,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc, writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { Collection, CollectionItem } from '../types/journal'
import { createDailyEntry } from '../utils/entryUtils'

export function useCollections() {
  const { uid, journalId } = useAuthStore()
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(firestore, `journals/${journalId}/collections`), snap => {
      setCollections(
        snap.docs
          .map(d => d.data() as Collection)
          .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      )
    })
  }, [uid, journalId])

  const addCollection = async (name: string) => {
    if (!uid || !name.trim()) return
    const col: Collection = { id: nanoid(), name: name.trim(), order: collections.length, createdAt: new Date().toISOString() }
    await setDoc(doc(firestore, `journals/${journalId}/collections/${col.id}`), col)
    return col.id
  }

  const renameCollection = async (id: string, name: string) => {
    if (!uid || !name.trim()) return
    await updateDoc(doc(firestore, `journals/${journalId}/collections/${id}`), { name: name.trim() })
  }

  const deleteCollection = async (id: string) => {
    if (!uid) return
    const itemsSnap = await getDocs(query(
      collection(firestore, `journals/${journalId}/collectionItems`),
      where('collectionId', '==', id),
    ))
    const wb = writeBatch(firestore)
    wb.delete(doc(firestore, `journals/${journalId}/collections/${id}`))
    itemsSnap.docs.forEach(d => wb.delete(d.ref))
    await wb.commit()
  }

  return { collections, addCollection, renameCollection, deleteCollection }
}

export function useCollectionItems(collectionId: string | null) {
  const { uid, journalId } = useAuthStore()
  const [items, setItems] = useState<CollectionItem[]>([])

  useEffect(() => {
    if (!uid || !collectionId) { setItems([]); return }
    const q = query(
      collection(firestore, `journals/${journalId}/collectionItems`),
      where('collectionId', '==', collectionId),
    )
    return onSnapshot(q, snap => {
      setItems(
        snap.docs
          .map(d => d.data() as CollectionItem)
          .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      )
    })
  }, [uid, journalId, collectionId])

  const addItem = async (content: string) => {
    if (!uid || !collectionId || !content.trim()) return
    const item: CollectionItem = {
      id: nanoid(), collectionId, content: content.trim(), checked: false,
      order: items.length, createdAt: new Date().toISOString(),
    }
    await setDoc(doc(firestore, `journals/${journalId}/collectionItems/${item.id}`), item)
  }

  const toggleItem = async (id: string, checked: boolean) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/collectionItems/${id}`), { checked })
  }

  const updateItem = async (id: string, content: string) => {
    if (!uid || !content.trim()) return
    await updateDoc(doc(firestore, `journals/${journalId}/collectionItems/${id}`), { content: content.trim() })
  }

  const deleteItem = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/collectionItems/${id}`))
  }

  // 📅 선택한 날짜의 Daily Log에 task로 편성한다(목록 항목은 유지).
  const scheduleToDaily = async (content: string, date: string) => {
    if (!uid) return
    const daily = createDailyEntry(content, 'task', date)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
  }

  return { items, addItem, toggleItem, updateItem, deleteItem, scheduleToDaily }
}
