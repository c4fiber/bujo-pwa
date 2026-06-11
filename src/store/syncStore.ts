import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { db } from '../db/schema'

const COLLECTIONS = ['dailyLogs', 'monthlyLogs', 'futureLogs'] as const
const SYNC_COOLDOWN_MS = 10 * 60 * 1000 // 10분

interface SyncStore {
  lastSyncedAt: number | null   // epoch ms
  syncing: boolean
  syncError: string | null
  sync: (journalId: string) => Promise<void>
  canSync: () => boolean
  nextSyncAvailableAt: () => number | null
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      lastSyncedAt: null,
      syncing: false,
      syncError: null,

      canSync: () => {
        const { lastSyncedAt, syncing } = get()
        if (syncing) return false
        if (!lastSyncedAt) return true
        return Date.now() - lastSyncedAt >= SYNC_COOLDOWN_MS
      },

      nextSyncAvailableAt: () => {
        const { lastSyncedAt } = get()
        if (!lastSyncedAt) return null
        const next = lastSyncedAt + SYNC_COOLDOWN_MS
        return next > Date.now() ? next : null
      },

      sync: async (journalId: string) => {
        if (!get().canSync()) return
        set({ syncing: true, syncError: null })
        try {
          // Dexie → Firestore 전체 업서트
          for (const col of COLLECTIONS) {
            const entries = await (db[col] as any).toArray()
            if (!entries.length) continue
            const wb = writeBatch(firestore)
            entries.forEach((entry: any) => {
              wb.set(doc(firestore, `journals/${journalId}/${col}/${entry.id}`), entry)
            })
            await wb.commit()
          }
          // Firestore → Dexie 병합 (다른 기기 데이터 수신)
          for (const col of COLLECTIONS) {
            const snap = await getDocs(collection(firestore, `journals/${journalId}/${col}`))
            const remote = snap.docs.map(d => d.data())
            if (remote.length) await (db[col] as any).bulkPut(remote)
          }
          set({ lastSyncedAt: Date.now(), syncing: false })
        } catch (e: any) {
          set({ syncing: false, syncError: e.message ?? '동기화 실패' })
        }
      },
    }),
    {
      name: 'bujo-sync-meta',
      partialize: (s) => ({ lastSyncedAt: s.lastSyncedAt }),
    }
  )
)
