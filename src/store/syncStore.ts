import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { waitForPendingWrites } from 'firebase/firestore'
import { firestore } from '../lib/firebase'

const AUTO_SYNC_DEBOUNCE_MS = 3 * 60 * 1000  // 변경 멈춘 후 3분 뒤 자동 동기화
const MANUAL_COOLDOWN_MS = 10 * 60 * 1000    // 수동 동기화는 10분에 1회

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null

interface SyncStore {
  lastSyncedAt: number | null        // 마지막 동기화 완료 시점 (자동/수동 공통)
  lastManualSyncAt: number | null    // 마지막 수동 동기화 시점 (쿨다운 기준)
  syncing: boolean
  syncError: string | null
  pendingAutoSync: boolean           // 자동 동기화 타이머 대기 중 여부
  notifyChange: () => void
  manualSync: () => Promise<void>
  canManualSync: () => boolean
  nextManualSyncAt: () => number | null
}

// 모든 로컬 쓰기가 서버에 반영될 때까지 대기
async function flushToServer() {
  await waitForPendingWrites(firestore)
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      lastSyncedAt: null,
      lastManualSyncAt: null,
      syncing: false,
      syncError: null,
      pendingAutoSync: false,

      // 데이터 변경 시 호출 — 3분 debounce 후 자동 동기화
      notifyChange: () => {
        if (autoSyncTimer) clearTimeout(autoSyncTimer)
        set({ pendingAutoSync: true })
        autoSyncTimer = setTimeout(async () => {
          autoSyncTimer = null
          set({ syncing: true, syncError: null })
          try {
            await flushToServer()
            set({ lastSyncedAt: Date.now(), syncing: false, pendingAutoSync: false })
          } catch (e: any) {
            set({ syncing: false, syncError: e.message ?? '자동 동기화 실패' })
          }
        }, AUTO_SYNC_DEBOUNCE_MS)
      },

      canManualSync: () => {
        const { lastManualSyncAt, syncing } = get()
        if (syncing) return false
        if (!lastManualSyncAt) return true
        return Date.now() - lastManualSyncAt >= MANUAL_COOLDOWN_MS
      },

      nextManualSyncAt: () => {
        const { lastManualSyncAt } = get()
        if (!lastManualSyncAt) return null
        const next = lastManualSyncAt + MANUAL_COOLDOWN_MS
        return next > Date.now() ? next : null
      },

      manualSync: async () => {
        if (!get().canManualSync()) return
        // 수동 동기화가 대기 중인 자동 동기화를 대체
        if (autoSyncTimer) {
          clearTimeout(autoSyncTimer)
          autoSyncTimer = null
        }
        set({ syncing: true, syncError: null })
        try {
          await flushToServer()
          set({
            lastSyncedAt: Date.now(),
            lastManualSyncAt: Date.now(),
            syncing: false,
            pendingAutoSync: false,
          })
        } catch (e: any) {
          set({ syncing: false, syncError: e.message ?? '동기화 실패' })
        }
      },
    }),
    {
      name: 'bujo-sync-meta',
      partialize: (s) => ({
        lastSyncedAt: s.lastSyncedAt,
        lastManualSyncAt: s.lastManualSyncAt,
      }),
    }
  )
)
