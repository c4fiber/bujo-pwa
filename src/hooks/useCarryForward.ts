import { useEffect } from 'react'
import {
  collection, doc, getDocs, query, where,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import { toDateString, parseDate, prevDay } from '../utils/dateUtils'
import type { DailyEntry } from '../types/journal'

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

async function runCarryForward(journalId: string, today: string) {
  const yesterday = prevDay(today)
  const openSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('bulletType', '==', 'task'),
    where('taskStatus', '==', 'open'),
    where('date', '==', yesterday),
  ))
  if (openSnap.empty) return

  // 이미 이월된 항목의 sourceId 수집 (중복 방지)
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

export function useCarryForward() {
  const { uid, journalId, ready } = useAuthStore()
  const today = toDateString(new Date())

  useEffect(() => {
    if (!uid || !ready) return
    if (inProgress) return
    inProgress = dedupeMigrated(journalId)
      .then(() => runCarryForward(journalId, today))
      .catch(console.error)
      .finally(() => { inProgress = null })
  }, [uid, journalId, ready, today])
}
