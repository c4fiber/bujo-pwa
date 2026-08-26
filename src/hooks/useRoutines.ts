import { useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, query, where,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { firestore } from '../lib/firebase'
import { setDoc, updateDoc, deleteDoc, writeBatch } from '../lib/syncedFirestore'
import { useAuthStore } from '../store/authStore'
import type { Routine, RoutineLog, RoutineDayStatus } from '../types/journal'

const pad = (n: number) => String(n).padStart(2, '0')
const dateStr = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

export function useRoutines(year: number, month: number) {
  const { uid, journalId } = useAuthStore()
  const [routines, setRoutines] = useState<Routine[]>([])
  // key = `${routineId}_${date}` → status
  const [logs, setLogs] = useState<Record<string, RoutineDayStatus>>({})

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(firestore, `journals/${journalId}/routines`), snap => {
      setRoutines(
        snap.docs
          .map(d => d.data() as Routine)
          .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      )
    })
  }, [uid, journalId])

  useEffect(() => {
    if (!uid) return
    const start = dateStr(year, month, 1)
    const end = dateStr(year, month, 31)
    const q = query(
      collection(firestore, `journals/${journalId}/routineLogs`),
      where('date', '>=', start),
      where('date', '<=', end),
    )
    return onSnapshot(q, snap => {
      const map: Record<string, RoutineDayStatus> = {}
      snap.docs.forEach(d => {
        const log = d.data() as RoutineLog
        map[`${log.routineId}_${log.date}`] = log.status
      })
      setLogs(map)
    })
  }, [uid, journalId, year, month])

  const addRoutine = async (name: string) => {
    if (!uid || !name.trim()) return
    const routine: Routine = {
      id: nanoid(),
      name: name.trim(),
      order: routines.length,
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(firestore, `journals/${journalId}/routines/${routine.id}`), routine)
  }

  const renameRoutine = async (id: string, name: string) => {
    if (!uid || !name.trim()) return
    await updateDoc(doc(firestore, `journals/${journalId}/routines/${id}`), { name: name.trim() })
  }

  const deleteRoutine = async (id: string) => {
    if (!uid) return
    // 루틴 문서 + 해당 루틴의 모든 기록 삭제
    const logsSnap = await import('firebase/firestore').then(m =>
      m.getDocs(query(collection(firestore, `journals/${journalId}/routineLogs`), where('routineId', '==', id)))
    )
    const wb = writeBatch(firestore)
    wb.delete(doc(firestore, `journals/${journalId}/routines/${id}`))
    logsSnap.docs.forEach(d => wb.delete(d.ref))
    await wb.commit()
  }

  // 상태 설정. status가 null이면 기록 삭제(회색으로 되돌림)
  const setStatus = async (routineId: string, date: string, status: RoutineDayStatus | null) => {
    if (!uid) return
    const logId = `${routineId}_${date}`
    const ref = doc(firestore, `journals/${journalId}/routineLogs/${logId}`)
    if (status === null) {
      await deleteDoc(ref)
    } else {
      const log: RoutineLog = { id: logId, routineId, date, status }
      await setDoc(ref, log)
    }
  }

  return { routines, logs, addRoutine, renameRoutine, deleteRoutine, setStatus }
}
