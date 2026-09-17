import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { subDays } from 'date-fns'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { BulletType, DailyEntry, TaskStatus } from '../types/journal'
import { createDailyEntry, dailyEntryMovedTo } from '../utils/entryUtils'
import { toDateString } from '../utils/dateUtils'

// 오늘로부터 daysBack일 이전까지의 Daily 항목을 한 번에 구독한다(미래 예정 항목 포함).
// daysBack을 늘려 과거를 페이징한다.
export function useDailyFeed(daysBack: number) {
  const { uid, journalId } = useAuthStore()
  const [entries, setEntries] = useState<DailyEntry[]>([])

  useEffect(() => {
    if (!uid) return
    const start = toDateString(subDays(new Date(), daysBack))
    const q = query(
      collection(firestore, `journals/${journalId}/dailyLogs`),
      where('date', '>=', start),
    )
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => d.data() as DailyEntry))
    })
  }, [uid, journalId, daysBack])

  const addEntry = async (content: string, bulletType: BulletType, date: string) => {
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

  // 📅 다른 날짜로 이동: 대상 날짜에 복제(origin: migrated) 후 원본은 migrated 처리
  const moveToDate = async (id: string, content: string, bulletType: BulletType, targetDate: string) => {
    if (!uid) return
    const src = entries.find(e => e.id === id)
    if (src && src.date === targetDate) return
    const moved = dailyEntryMovedTo(content, bulletType, targetDate, id)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${moved.id}`), moved)
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { taskStatus: 'migrated' })
  }

  return { entries, addEntry, updateStatus, updateContent, deleteEntry, moveToDate }
}
