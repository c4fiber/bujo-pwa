import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where, getDocs,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc, writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { InboxGroup, InboxItem } from '../types/journal'
import { createDailyEntry } from '../utils/entryUtils'

// 업무/고객사 그룹
export function useInboxGroups() {
  const { uid, journalId } = useAuthStore()
  const [groups, setGroups] = useState<InboxGroup[]>([])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(firestore, `journals/${journalId}/inboxGroups`), snap => {
      setGroups(
        snap.docs
          .map(d => d.data() as InboxGroup)
          .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      )
    })
  }, [uid, journalId])

  const addGroup = async (name: string) => {
    if (!uid || !name.trim()) return
    const g: InboxGroup = { id: nanoid(), name: name.trim(), order: groups.length, createdAt: new Date().toISOString() }
    await setDoc(doc(firestore, `journals/${journalId}/inboxGroups/${g.id}`), g)
    return g.id
  }

  const renameGroup = async (id: string, name: string) => {
    if (!uid || !name.trim()) return
    await updateDoc(doc(firestore, `journals/${journalId}/inboxGroups/${id}`), { name: name.trim() })
  }

  const deleteGroup = async (id: string) => {
    if (!uid) return
    const itemsSnap = await getDocs(query(
      collection(firestore, `journals/${journalId}/inboxItems`),
      where('groupId', '==', id),
    ))
    const wb = writeBatch(firestore)
    wb.delete(doc(firestore, `journals/${journalId}/inboxGroups/${id}`))
    itemsSnap.docs.forEach(d => wb.delete(d.ref))
    await wb.commit()
  }

  return { groups, addGroup, renameGroup, deleteGroup }
}

// 선택한 그룹의 항목
export function useInboxItems(groupId: string | null) {
  const { uid, journalId } = useAuthStore()
  const [items, setItems] = useState<InboxItem[]>([])

  useEffect(() => {
    if (!uid || !groupId) { setItems([]); return }
    const q = query(
      collection(firestore, `journals/${journalId}/inboxItems`),
      where('groupId', '==', groupId),
    )
    return onSnapshot(q, snap => {
      setItems(
        snap.docs
          .map(d => d.data() as InboxItem)
          .sort((a, b) => {
            // 기한 있는 항목 우선(임박 순), 없으면 생성 순
            if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
            if (a.deadline) return -1
            if (b.deadline) return 1
            return a.order - b.order || a.createdAt.localeCompare(b.createdAt)
          })
      )
    })
  }, [uid, journalId, groupId])

  const addItem = async (content: string, deadline?: string) => {
    if (!uid || !groupId || !content.trim()) return
    const item: InboxItem = {
      id: nanoid(), groupId, content: content.trim(),
      ...(deadline ? { deadline } : {}),
      order: items.length, createdAt: new Date().toISOString(),
    }
    await setDoc(doc(firestore, `journals/${journalId}/inboxItems/${item.id}`), item)
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid || !content.trim()) return
    await updateDoc(doc(firestore, `journals/${journalId}/inboxItems/${id}`), { content: content.trim() })
  }

  const setDeadline = async (id: string, deadline: string | undefined) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/inboxItems/${id}`), { deadline: deadline ?? null })
  }

  const deleteItem = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/inboxItems/${id}`))
  }

  // 📅 Daily로 편성: 선택한 날짜의 Daily에 항목 생성 후 inbox에서 제거
  const scheduleToDaily = async (item: InboxItem, date: string) => {
    if (!uid) return
    const daily = createDailyEntry(item.content, 'task', date)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    await deleteDoc(doc(firestore, `journals/${journalId}/inboxItems/${item.id}`))
  }

  return { items, addItem, updateContent, setDeadline, deleteItem, scheduleToDaily }
}
