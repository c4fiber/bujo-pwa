import { nanoid } from 'nanoid'
import type { BulletType, DailyEntry, FutureEntry } from '../types/journal'
import { toDateString, parseDate } from './dateUtils'

export const createDailyEntry = (
  content: string,
  bulletType: BulletType,
  date: string,
): DailyEntry => {
  const { year, month, day } = parseDate(date)
  return {
    id: nanoid(),
    content,
    bulletType,
    ...(bulletType === 'task' && { taskStatus: 'open' as const }),
    tags: [],
    date,
    year,
    month,
    day,
    origin: 'manual',
  }
}

export const createFutureEntry = (
  content: string,
  bulletType: BulletType,
  year: number,
  month: number,
): FutureEntry => ({
  id: nanoid(),
  content,
  bulletType,
  ...(bulletType === 'task' && { taskStatus: 'open' as const }),
  tags: [],
  year,
  month,
})

// Future 항목을 특정 날짜의 Daily 항목으로 복제(origin: from-future)
export const dailyEntryFromFuture = (future: FutureEntry, date: string): DailyEntry => {
  const { year, month, day } = parseDate(date)
  return {
    id: nanoid(),
    content: future.content,
    bulletType: future.bulletType,
    ...(future.bulletType === 'task' && { taskStatus: 'open' as const }),
    tags: future.tags ?? [],
    date,
    year,
    month,
    day,
    origin: 'from-future',
    sourceId: future.id,
  }
}

// Daily 항목을 다른 날짜로 이동할 때 사용하는 복제(origin: migrated)
export const dailyEntryMovedTo = (
  content: string,
  bulletType: BulletType,
  date: string,
  sourceId: string,
): DailyEntry => {
  const { year, month, day } = parseDate(date)
  return {
    id: nanoid(),
    content,
    bulletType,
    ...(bulletType === 'task' && { taskStatus: 'open' as const }),
    tags: [],
    date,
    year,
    month,
    day,
    origin: 'migrated',
    sourceId,
  }
}

export const todayString = () => toDateString(new Date())
