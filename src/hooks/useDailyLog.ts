import { useEffect, useState } from 'react'
import {
  collection, deleteField, doc, onSnapshot, query,
  setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
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

  // task를 특정 날짜로 연기: Daily는 open 유지, Monthly에 사본 생성
  const delayTask = async (id: string, content: string, targetDate: string) => {
    if (!uid) return
    const { year, month } = parseDate(targetDate)

    const monthly = createMonthlyEntry(content, 'task', year, month, targetDate)
    await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)

    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      delayedMonthlyId: monthly.id,
      updatedAt: new Date().toISOString(),
    })
  }

  // 연기 취소: Monthly 사본 삭제 + Daily delayedMonthlyId 제거
  const undoDelayTask = async (id: string, delayedMonthlyId?: string) => {
    if (!uid) return
    if (delayedMonthlyId) {
      await deleteDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${delayedMonthlyId}`))
    }
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), {
      delayedMonthlyId: deleteField(),
      updatedAt: new Date().toISOString(),
    })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, delayTask, undoDelayTask }
}
