import Dexie, { type Table } from 'dexie'
import type { DailyEntry, MonthlyEntry, FutureEntry } from '../types/journal'

class BulletJournalDB extends Dexie {
  dailyLogs!: Table<DailyEntry>
  monthlyLogs!: Table<MonthlyEntry>
  futureLogs!: Table<FutureEntry>

  constructor() {
    super('BulletJournalDB')
    this.version(1).stores({
      dailyLogs: 'id, date, year, month, day, origin, sourceId, [year+month]',
      monthlyLogs: 'id, year, month, scheduledDate, [year+month]',
      futureLogs: 'id, year, month, scheduledDate, [year+month]',
    })
  }
}

export const db = new BulletJournalDB()
