import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, MonthlyEntry, TaskStatus } from '../types/journal'
import { createMonthlyEntry, createFutureEntry } from '../utils/entryUtils'
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

  // targetMonth: 뷰의 month 대신 선택한 월 사용 (필수)
  // scheduledDate: 일까지 선택했을 때만 전달 (선택)
  const addEntry = async (content: string, bulletType: BulletType, targetMonth?: number, scheduledDate?: string) => {
    if (!uid) return
    const entryMonth = targetMonth ?? month
    const entryYear = scheduledDate ? parseDate(scheduledDate).year : year
    const entry = createMonthlyEntry(content, bulletType, entryYear, entryMonth, scheduledDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${entry.id}`), entry)
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

  // > (Migrate to Daily): Monthly task → 오늘의 Daily Log (한 단계 오른쪽)
  const migrateToDaily = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid) return
    const daily = createDailyEntry(content, bulletType, targetDate)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    await updateDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${id}`), {
      taskStatus: 'migrated',
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture, migrateToDaily }
}
