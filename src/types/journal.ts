export type BulletType = 'task' | 'event' | 'note';
export type TaskStatus = 'open' | 'completed' | 'migrated' | 'cancelled' | 'scheduled';
export type EntryOrigin = 'manual' | 'from-monthly' | 'from-future' | 'migrated';

export interface BaseEntry {
  id: string;
  content: string;
  bulletType: BulletType;
  taskStatus?: TaskStatus;
  tags: string[];
  gcalEventId?: string;  // Google Calendar 연동용 (event 전용)
}

export interface DailyEntry extends BaseEntry {
  date: string;        // YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  origin: EntryOrigin;
  sourceId?: string;
  delayedMonthlyId?: string;   // 연기 시 생성된 Monthly 항목 ID (undo용)
}

export interface MonthlyEntry extends BaseEntry {
  year: number;
  month: number;
  scheduledDate?: string;
  sourceId?: string;      // Future Log에서 자동 생성된 경우 futureEntry.id
}

export interface FutureEntry extends BaseEntry {
  year: number;
  month: number;
  // scheduledDate 없음 — Future Log는 월 단위 기록만
}
