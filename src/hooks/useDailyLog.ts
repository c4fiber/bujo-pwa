import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, DailyEntry, TaskStatus } from '../types/journal'
import { createDailyEntry, dailyEntryMovedTo } from '../utils/entryUtils'

export function useDailyLog(date: string) {
  const { uid, journalId } = useAuthStore()
  const [entries, setEntries] = useState<DailyEntry[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(firestore, `journals/${journalId}/dailyLogs`),
      where('date', '==', date),
    )
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => d.data() as DailyEntry))
    })
  }, [uid, journalId, date])

  const addEntry = async (content: string, bulletType: BulletType) => {
    if (!uid) return
    const entry = createDailyEntry(content, bulletType, date)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${entry.id}`), entry)
  }

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { taskStatus })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { content })
  }

  const deleteEntry = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`))
  }

  // 📅 다른 날짜로 이동: 대상 날짜에 복제(origin: migrated) 후 원본은 migrated 처리
  const moveToDate = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid || targetDate === date) return
    const moved = dailyEntryMovedTo(content, bulletType, targetDate, id)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${moved.id}`), moved)
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { taskStatus: 'migrated' })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, moveToDate }
}
