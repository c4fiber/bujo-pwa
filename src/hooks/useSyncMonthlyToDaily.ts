import { useEffect } from 'react'
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, query,
  setDoc, updateDoc, where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import type { MonthlyEntry, DailyEntry } from '../types/journal'
import { dailyEntryFromMonthly } from '../utils/entryUtils'

async function purgeFromFutureEntries(journalId: string) {
  const snap = await getDocs(query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('origin', '==', 'from-future'),
  ))
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

async function syncMonthlyToDaily(journalId: string, monthly: MonthlyEntry) {
  const date = monthly.scheduledDate!
  const q = query(
    collection(firestore, `journals/${journalId}/dailyLogs`),
    where('sourceId', '==', monthly.id),
  )
  const snap = await getDocs(q)

  if (snap.empty) {
    const entry = dailyEntryFromMonthly(monthly, date)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${entry.id}`), entry)
  } else {
    const existing = snap.docs[0].data() as DailyEntry
    const updates: Partial<DailyEntry> = {}
    if (existing.content !== monthly.content) updates.content = monthly.content
    if (existing.date !== date) updates.date = date
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString()
      await updateDoc(snap.docs[0].ref, updates)
    }
  }
}

// Monthly → Daily 단방향 동기화
// Future → Monthly는 useSyncFutureToMonthly에서 처리
export function useSyncMonthlyToDaily(year: number) {
  const { uid, journalId } = useAuthStore()

  useEffect(() => {
    if (!uid) return
    purgeFromFutureEntries(journalId)
    return onSnapshot(
      query(collection(firestore, `journals/${journalId}/monthlyLogs`), where('year', '==', year)),
      snap => snap.docs
        .map(d => d.data() as MonthlyEntry)
        .filter(e => !!e.scheduledDate)
        .forEach(e => syncMonthlyToDaily(journalId, e)),
    )
  }, [uid, journalId, year])
}
