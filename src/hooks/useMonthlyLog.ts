import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, MonthlyEntry, TaskStatus } from '../types/journal'
import { createFutureEntry } from '../utils/entryUtils'
import { createMonthlyLog } from '../lib/monthlyLog'
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
            if (a.scheduledDate && b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate)
            if (a.scheduledDate) return -1
            if (b.scheduledDate) return 1
            return a.id.localeCompare(b.id)
          })
      )
    })
  }, [uid, journalId, year, month])

  // Monthly log는 날짜(scheduledDate) 필수.
  // 생성 로직(createMonthlyLog)이 해당 날짜의 Daily Log 생성까지 단독 처리한다.
  const addEntry = async (content: string, bulletType: BulletType, scheduledDate: string) => {
    if (!uid) return
    const { year: entryYear, month: entryMonth } = parseDate(scheduledDate)
    await createMonthlyLog(journalId, { content, bulletType, year: entryYear, month: entryMonth, scheduledDate })
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

  return { entries, addEntry, updateStatus, updateContent, setScheduledDate, deleteEntry, scheduleToFuture }
}
