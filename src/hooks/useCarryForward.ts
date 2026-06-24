import { useEffect } from 'react'
import {
  collection, doc, getDocs, query, where,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import { toDateString, parseDate, prevDay } from '../utils/dateUtils'
import type { DailyEntry, MonthlyEntry } from '../types/journal'

let inProgress: Promise<void> | null = null

async function dedupeMigrated(journalId: string) {
  const snap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'migrated'),
  ))
  const bySource = new Map<string, typeof snap.docs>()
  for (const d of snap.docs) {
    const sid = (d.data() as DailyEntry).sourceId
    if (!sid) continue
    const arr = bySource.get(sid) ?? []
    arr.push(d)
    bySource.set(sid, arr)
  }
  const wb = writeBatch(firestore)
  let count = 0
  for (const [, docs] of bySource) {
    if (docs.length <= 1) continue
    docs.sort((a, b) => (a.data() as DailyEntry).id.localeCompare((b.data() as DailyEntry).id))
    for (const d of docs.slice(1)) {
      wb.delete(d.ref)
      count++
    }
  }
  if (count > 0) await wb.commit()
}

// 어제의 미완료 daily task → 오늘 daily로 이월
async function runDailyCarryForward(journalId: string, today: string) {
  const yesterday = prevDay(today)
  const openSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('bulletType', '==', 'task'),
    where('taskStatus', '==', 'open'),
    where('date', '==', yesterday),
  ))
  if (openSnap.empty) return

  const carriedSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'migrated'),
  ))
  const carriedSourceIds = new Set(
    carriedSnap.docs.map(d => (d.data() as DailyEntry).sourceId).filter(Boolean)
  )

  const { year, month, day } = parseDate(today)
  const wb = writeBatch(firestore)
  let count = 0

  for (const taskDoc of openSnap.docs) {
    const task = taskDoc.data() as DailyEntry
    if (carriedSourceIds.has(task.id)) continue
    if (task.delayedMonthlyId) continue

    const carriedEntry: DailyEntry = {
      id: nanoid(),
      content: task.content,
      bulletType: 'task',
      taskStatus: 'open',
      tags: task.tags ?? [],
      date: today,
      year, month, day,
      origin: 'migrated',
      sourceId: task.id,
    }

    wb.set(doc(firestore, `journals/${journalId}/dailyLogs/${carriedEntry.id}`), carriedEntry)
    wb.update(taskDoc.ref, { taskStatus: 'migrated' })
    count++
  }

  if (count > 0) await wb.commit()
}

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

export function useCarryForward() {
  const { uid, journalId, ready } = useAuthStore()
  const today = toDateString(new Date())

  useEffect(() => {
    if (!uid || !ready) return
    if (inProgress) return
    inProgress = dedupeMigrated(journalId)
      .then(() => runDailyCarryForward(journalId, today))
      .then(() => runMonthlyToDaily(journalId, today))
      .catch(console.error)
      .finally(() => { inProgress = null })
  }, [uid, journalId, ready, today])
}
