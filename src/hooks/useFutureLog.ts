import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, FutureEntry, TaskStatus } from '../types/journal'
import { createFutureEntry, createMonthlyEntry } from '../utils/entryUtils'
import { parseDate } from '../utils/dateUtils'

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
          .sort((a, b) => a.month - b.month || a.createdAt.localeCompare(b.createdAt))
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
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), {
      taskStatus, updatedAt: new Date().toISOString(),
    })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), {
      content, updatedAt: new Date().toISOString(),
    })
  }

  const deleteEntry = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`))
  }

  // Future task → Monthly 특정 날짜로 schedule
  const scheduleToMonthly = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid) return
    const { year: y, month } = parseDate(targetDate)
    const monthly = createMonthlyEntry(content, bulletType, y, month, targetDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), {
      taskStatus: 'scheduled',
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly }
}
