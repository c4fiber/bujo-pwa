import { useEffect } from 'react'
import {
  collection, doc, getDocs, query, where,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import { toDateString, parseDate } from '../utils/dateUtils'
import type { DailyEntry, MonthlyEntry } from '../types/journal'

let inProgress: Promise<void> | null = null

// 오늘이 scheduledDate인 monthly log → daily log 자동 생성
async function runMonthlyToDaily(journalId: string, today: string) {
  const monthlySnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/monthlyLogs`),
    where('scheduledDate', '==', today),
  ))
  if (monthlySnap.empty) return

  // 이미 from-monthly로 생성된 daily entry의 sourceId 수집
  const existingSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'from-monthly'),
    where('date', '==', today),
  ))
  const existingSourceIds = new Set(
    existingSnap.docs.map(d => (d.data() as DailyEntry).sourceId).filter(Boolean)
  )

  const { year, month, day } = parseDate(today)
  const wb = writeBatch(firestore)
  let count = 0

  for (const mDoc of monthlySnap.docs) {
    const monthly = mDoc.data() as MonthlyEntry
    if (existingSourceIds.has(monthly.id)) continue
    // 이미 완료/취소/예약된 항목은 건너뜀
    if (monthly.taskStatus && ['completed', 'cancelled', 'scheduled', 'migrated'].includes(monthly.taskStatus)) continue

    const dailyEntry: DailyEntry = {
      id: nanoid(),
      content: monthly.content,
      bulletType: monthly.bulletType,
      ...(monthly.bulletType === 'task' && { taskStatus: 'open' as const }),
      tags: monthly.tags ?? [],
      date: today,
      year, month, day,
      origin: 'from-monthly',
      sourceId: monthly.id,
    }

    wb.set(doc(firestore, `journals/${journalId}/dailyLogs/${dailyEntry.id}`), dailyEntry)
    count++
  }

  if (count > 0) await wb.commit()
}

// 매일 첫 접속 시 오늘 일정인 Monthly 항목만 Daily로 자동 생성한다.
// (어제 미완료 task의 자동 이월은 의도적으로 제거됨 — 사용자가 수동으로 < 이동)
export function useCarryForward() {
  const { uid, journalId, ready } = useAuthStore()
  const today = toDateString(new Date())

  useEffect(() => {
    if (!uid || !ready) return
    if (inProgress) return
    inProgress = runMonthlyToDaily(journalId, today)
      .catch(console.error)
      .finally(() => { inProgress = null })
  }, [uid, journalId, ready, today])
}
