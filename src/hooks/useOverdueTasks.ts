import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { DailyEntry, TaskStatus } from '../types/journal'
import { createDailyEntry } from '../utils/entryUtils'

// 오늘 이전의 미완료(open) task를 모두 가져온다. (BuJo Migration 대상)
export function useOverdueTasks(today: string) {
  const { uid, journalId } = useAuthStore()
  const [overdue, setOverdue] = useState<DailyEntry[]>([])

  useEffect(() => {
    if (!uid) return
    // 두 개의 equality 필터만 사용하고 날짜 비교는 클라이언트에서 수행
    // (Firestore 복합 인덱스 요구를 피함)
    const q = query(
      collection(firestore, `journals/${journalId}/dailyLogs`),
      where('bulletType', '==', 'task'),
      where('taskStatus', '==', 'open'),
    )
    return onSnapshot(q, snap => {
      setOverdue(
        snap.docs
          .map(d => d.data() as DailyEntry)
          .filter(e => e.date < today)
          .sort((a, b) => a.date.localeCompare(b.date))
      )
    })
  }, [uid, journalId, today])

  // 오늘로 가져오기: 오늘 Daily에 복사(origin: migrated) + 원본은 migrated 처리
  const bringToToday = async (entry: DailyEntry) => {
    if (!uid) return
    const carried = { ...createDailyEntry(entry.content, 'task', today), origin: 'migrated' as const, sourceId: entry.id }
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${carried.id}`), carried)
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${entry.id}`), { taskStatus: 'migrated' })
  }

  const setStatus = async (id: string, taskStatus: TaskStatus) => {
    if (!uid) return
    await updateDoc(doc(firestore, `journals/${journalId}/dailyLogs/${id}`), { taskStatus })
  }

  return { overdue, bringToToday, setStatus }
}
