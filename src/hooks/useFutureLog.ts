import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, FutureEntry, TaskStatus } from '../types/journal'
import { createFutureEntry, createMonthlyEntry, createDailyEntry } from '../utils/entryUtils'

export function useFutureLog(year: number) {
  const { uid, journalId } = useAuthStore()
  const [entries, setEntries] = useState<FutureEntry[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(firestore, `journals/${journalId}/futureLogs`),
      where('year', '==', year),
    )
    return onSnapshot(q, snap => {
      setEntries(
        snap.docs
          .map(d => d.data() as FutureEntry)
          .sort((a, b) => a.month - b.month || a.id.localeCompare(b.id))
      )
    })
  }, [uid, journalId, year])

  const addEntry = async (content: string, bulletType: BulletType, month: number) => {
    if (!uid) return
    const entry = createFutureEntry(content, bulletType, year, month)
    await setDoc(doc(firestore, `journals/${journalId}/futureLogs/${entry.id}`), entry)
  }

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), { taskStatus })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), { content })
  }

  const deleteEntry = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`))
  }

  const scheduleToMonthly = async (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number, targetDay?: number) => {
    if (!uid) return
    const scheduledDate = targetDay
      ? `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
      : undefined
    const monthly = createMonthlyEntry(content, bulletType, targetYear, targetMonth, scheduledDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)
    if (scheduledDate) {
      const daily = createDailyEntry(content, bulletType, scheduledDate)
      await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    }
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), { taskStatus: 'scheduled' })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly }
}
