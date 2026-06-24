import { nanoid } from 'nanoid'
import type { BulletType, DailyEntry, MonthlyEntry, FutureEntry } from '../types/journal'
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

export const createMonthlyEntry = (
  content: string,
  bulletType: BulletType,
  year: number,
  month: number,
  scheduledDate?: string,
): MonthlyEntry => ({
  id: nanoid(),
  content,
  bulletType,
  ...(bulletType === 'task' && { taskStatus: 'open' as const }),
  tags: [],
  year,
  month,
  ...(scheduledDate !== undefined && { scheduledDate }),
})

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

export const dailyEntryFromMonthly = (monthly: MonthlyEntry, date: string): DailyEntry => {
  const { year, month, day } = parseDate(date)
  return {
    ...monthly,
    id: nanoid(),
    date,
    year,
    month,
    day,
    origin: 'from-monthly',
    sourceId: monthly.id,
  }
}

export const dailyEntryFromFuture = (future: FutureEntry, date: string): DailyEntry => {
  const { year, month, day } = parseDate(date)
  return {
    ...future,
    id: nanoid(),
    date,
    year,
    month,
    day,
    origin: 'from-future',
    sourceId: future.id,
  }
}

export const todayString = () => toDateString(new Date())
