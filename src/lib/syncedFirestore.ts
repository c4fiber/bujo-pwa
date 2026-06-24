// Firestore 쓰기 래퍼 — 쓰기 발생 시 syncStore에 변경 알림 (3분 debounce 자동 동기화 트리거)
import {
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  writeBatch as fsWriteBatch,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore'
import { useSyncStore } from '../store/syncStore'

const notify = () => useSyncStore.getState().notifyChange()

export const setDoc: typeof fsSetDoc = ((...args: Parameters<typeof fsSetDoc>) => {
  const p = fsSetDoc(...args)
  notify()
  return p
}) as typeof fsSetDoc

export const updateDoc: typeof fsUpdateDoc = ((...args: Parameters<typeof fsUpdateDoc>) => {
  const p = fsUpdateDoc(...args)
  notify()
  return p
}) as typeof fsUpdateDoc

export const deleteDoc: typeof fsDeleteDoc = ((...args: Parameters<typeof fsDeleteDoc>) => {
  const p = fsDeleteDoc(...args)
  notify()
  return p
}) as typeof fsDeleteDoc

export function writeBatch(db: Firestore): WriteBatch {
  const wb = fsWriteBatch(db)
  const originalCommit = wb.commit.bind(wb)
  wb.commit = () => {
    const p = originalCommit()
    notify()
    return p
  }
  return wb
}
