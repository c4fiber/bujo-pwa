import { useEffect } from 'react'
import {
  collection, doc, getDocs, query, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import { toDateString, prevDay } from '../utils/dateUtils'
import { dailyEntryMovedTo } from '../utils/entryUtils'
import type { DailyEntry } from '../types/journal'

let inProgress: Promise<void> | null = null

// 말보다 행동: 미루기를 "결심"에 맡기지 않고, 날짜가 바뀌면 어제의 미완료 task를
// 시스템이 자동으로 오늘로 옮긴다(origin: migrated). 사용자는 결과만 보고
// 완료/삭제로 정리한다 — 이동된 항목의 상태는 더 이상 수동으로 바꿀 수 없다.
async function runCarryForward(journalId: string, today: string) {
  const yesterday = prevDay(today)
  const openSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('bulletType', '==', 'task'),
    where('taskStatus', '==', 'open'),
    where('date', '==', yesterday),
  ))
  if (openSnap.empty) return

  // 이미 오늘로 이월된 항목의 sourceId 수집 (중복 방지, idempotent)
  const movedSnap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'migrated'),
    where('date', '==', today),
  ))
  const movedSourceIds = new Set(
    movedSnap.docs.map(d => (d.data() as DailyEntry).sourceId).filter(Boolean)
  )

  const wb = writeBatch(firestore)
  let count = 0

  for (const taskDoc of openSnap.docs) {
    const task = taskDoc.data() as DailyEntry
    if (movedSourceIds.has(task.id)) continue

    const moved = dailyEntryMovedTo(task.content, task.bulletType, today, task.id)
    wb.set(doc(firestore, `journals/${journalId}/dailyLogs/${moved.id}`), moved)
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
    inProgress = runCarryForward(journalId, today)
      .catch(console.error)
      .finally(() => { inProgress = null })
  }, [uid, journalId, ready, today])
}
