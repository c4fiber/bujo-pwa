import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query,
  setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import type { BulletType, MonthlyEntry, TaskStatus } from '../types/journal'
import { createMonthlyEntry, createFutureEntry, createDailyEntry } from '../utils/entryUtils'
import { nextMonth } from '../utils/dateUtils'

export function useMonthlyLog(year: number, month: number) {
  const { uid, journalId } = useAuthStore()
  const [entries, setEntries] = useState<MonthlyEntry[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(firestore, `journals/${journalId}/monthlyLogs`),
      where('year', '==', year),
      where('month', '==', month),
    )
    return onSnapshot(q, snap => {
      setEntries(
        snap.docs
          .map(d => d.data() as MonthlyEntry)
          .sort((a, b) => {
            const da = a.scheduledDate ?? a.createdAt
            const db = b.scheduledDate ?? b.createdAt
            return da.localeCompare(db)
          })
      )
    })
  }, [uid, journalId, year, month])

  const addEntry = async (content: string, bulletType: BulletType, scheduledDate?: string) => {
    if (!uid) return
    const entry = createMonthlyEntry(content, bulletType, year, month, scheduledDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${entry.id}`), entry)
    if (scheduledDate) {
      const daily = createDailyEntry(content, bulletType, scheduledDate)
      await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    }
  }

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      taskStatus, updatedAt: new Date().toISOString(),
    })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      content, updatedAt: new Date().toISOString(),
    })
  }

  const setScheduledDate = async (id: string, scheduledDate: string | undefined) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      scheduledDate: scheduledDate ?? null, updatedAt: new Date().toISOString(),
    })
  }

  const deleteEntry = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`))
  }

  const scheduleToFuture = async (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number) => {
    if (!uid) return
    const future = createFutureEntry(content, bulletType, targetYear, targetMonth)
    await setDoc(doc(firestore, `journals/${journalId}/futureLogs/${future.id}`), future)
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      taskStatus: 'scheduled',
      updatedAt: new Date().toISOString(),
    })
  }

  // > (Migrated): Monthly task → next month's Monthly Log
  const migrateToNextMonth = async (id: string, content: string, bulletType: BulletType) => {
    if (!uid) return
    const { year: ny, month: nm } = nextMonth(year, month)
    const next = createMonthlyEntry(content, bulletType, ny, nm)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${next.id}`), next)
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      taskStatus: 'migrated',
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture, migrateToNextMonth }
}
