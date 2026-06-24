import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, MonthlyEntry, TaskStatus } from '../types/journal'
import { createMonthlyEntry, createFutureEntry, createDailyEntry } from '../utils/entryUtils'
import { parseDate } from '../utils/dateUtils'

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
            // scheduledDate 있는 항목이 먼저, 없으면 id 순(삽입 순서 근사)
            if (a.scheduledDate && b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate)
            if (a.scheduledDate) return -1
            if (b.scheduledDate) return 1
            return a.id.localeCompare(b.id)
          })
      )
    })
  }, [uid, journalId, year, month])

  const addEntry = async (content: string, bulletType: BulletType, targetMonth?: number, scheduledDate?: string) => {
    if (!uid) return
    const entryMonth = targetMonth ?? month
    const entryYear = scheduledDate ? parseDate(scheduledDate).year : year
    const entry = createMonthlyEntry(content, bulletType, entryYear, entryMonth, scheduledDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${entry.id}`), entry)
  }

  const updateStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), { taskStatus })
  }

  const updateContent = async (id: string, content: string) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), { content })
  }

  const setScheduledDate = async (id: string, scheduledDate: string | undefined) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      scheduledDate: scheduledDate ?? null,
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
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), { taskStatus: 'scheduled' })
  }

  const migrateToDaily = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid) return
    const daily = createDailyEntry(content, bulletType, targetDate)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), { taskStatus: 'migrated' })
  }

  return { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture, migrateToDaily }
}
