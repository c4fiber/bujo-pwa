import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, DailyEntry, TaskStatus } from '../types/journal'
import { createDailyEntry, createFutureEntry } from '../utils/entryUtils'

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
      setEntries(
        snap.docs
          .map(d => d.data() as DailyEntry)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      )
    })
  }, [uid, journalId, date])

  const addEntry = async (content: string, bulletType: BulletType) => {
    if (!uid) return
    const entry = createDailyEntry(content, bulletType, date)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${entry.id}`), entry)
  }

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      taskStatus, updatedAt: new Date().toISOString(),
    })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      content, updatedAt: new Date().toISOString(),
    })
  }

  const deleteEntry = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`))
  }

  // < (Scheduled): Daily task → Future Log
  const scheduleToFuture = async (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number) => {
    if (!uid) return
    const future = createFutureEntry(content, bulletType, targetYear, targetMonth)
    await setDoc(doc(firestore, `journals/${journalId}/futureLogs/${future.id}`), future)
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      taskStatus: 'scheduled',
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToFuture }
}
