import { useEffect } from 'react'
import {
  collection, doc, getDocs, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import { toDateString } from '../utils/dateUtils'
import type { DailyEntry, MonthlyEntry } from '../types/journal'
import { dailyEntryFromMonthly } from '../utils/entryUtils'

let inProgress: Promise<void> | null = null

const SKIP_STATUS = ['completed', 'cancelled', 'scheduled', 'migrated']

// scheduledDate(월.일)가 지정된 Monthly 항목을 그 날짜의 Daily Log에 생성한다.
// 날짜 무관하게 전체를 대상으로 하며, 이미 만들어진 것은 sourceId로 중복 제거(idempotent).
async function reconcileMonthlyToDaily(journalId: string) {
  const monthlySnap = await getDocs(
    collection(firestore, `journals/${journalId}/monthlyLogs`)
  )
  if (monthlySnap.empty) return

  // 이미 from-monthly로 생성된 daily의 sourceId 집합
  const existingSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'from-monthly'),
  ))
  const existingSourceIds = new Set(
    existingSnap.docs.map(d => (d.data() as DailyEntry).sourceId).filter(Boolean)
  )

  const wb = writeBatch(firestore)
  let count = 0

  for (const mDoc of monthlySnap.docs) {
    const monthly = mDoc.data() as MonthlyEntry
    if (!monthly.scheduledDate) continue                    // 날짜 미지정 항목은 제외
    if (existingSourceIds.has(monthly.id)) continue         // 이미 생성됨
    if (monthly.taskStatus && SKIP_STATUS.includes(monthly.taskStatus)) continue

    const daily = dailyEntryFromMonthly(monthly, monthly.scheduledDate)
    wb.set(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
    count++
  }

  if (count > 0) await wb.commit()
}

// 앱 진입 시 날짜가 지정된 Monthly 항목을 해당 날짜 Daily Log로 동기화한다.
// (어제 미완료 task의 자동 이월은 의도적으로 제거됨 — 사용자가 수동으로 < 이동)
export function useCarryForward() {
  const { uid, journalId, ready } = useAuthStore()
  const today = toDateString(new Date())

  useEffect(() => {
    if (!uid || !ready) return
    if (inProgress) return
    inProgress = reconcileMonthlyToDaily(journalId)
      .catch(console.error)
      .finally(() => { inProgress = null })
  }, [uid, journalId, ready, today])
}
