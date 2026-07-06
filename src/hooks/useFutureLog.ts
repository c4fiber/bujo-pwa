import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, FutureEntry, TaskStatus } from '../types/journal'
import { createFutureEntry } from '../utils/entryUtils'
import { createMonthlyLog } from '../lib/monthlyLog'

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

  // > (Schedule to Monthly): Future → Monthly Log 생성만 트리거한다.
  // Daily Log 생성/표현은 Monthly Log 로직(createMonthlyLog)이 단독으로 처리.
  const scheduleToMonthly = async (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number, targetDay?: number) => {
    if (!uid) return
    const scheduledDate = targetDay
      ? `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
      : undefined
    await createMonthlyLog(journalId, { content, bulletType, year: targetYear, month: targetMonth, scheduledDate })
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), { taskStatus: 'scheduled' })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly }
}
