import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query,
  setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import type { BulletType, FutureEntry, TaskStatus } from '../types/journal'
import { createFutureEntry, createMonthlyEntry } from '../utils/entryUtils'

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

  // > (Schedule to Monthly): Future → Monthly (월 선택, 특정 일 없음)
  const scheduleToMonthly = async (id: string, content: string, bulletType: BulletType, targetYear: number, targetMonth: number) => {
    if (!uid) return
    const monthly = createMonthlyEntry(content, bulletType, targetYear, targetMonth)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)
    await updateDoc(doc(firestore, `journals/${journalId}/futureLogs/${id}`), {
      taskStatus: 'scheduled',
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly }
}
