import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, DailyEntry, TaskStatus } from '../types/journal'
import { createDailyEntry, createMonthlyEntry } from '../utils/entryUtils'
import { parseDate } from '../utils/dateUtils'

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

  const scheduleToMonthly = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid) return
    const { year, month } = parseDate(targetDate)
    const monthly = createMonthlyEntry(content, bulletType, year, month, targetDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { taskStatus: 'scheduled' })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, scheduleToMonthly }
}
