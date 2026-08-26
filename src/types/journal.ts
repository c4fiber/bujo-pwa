export type BulletType = 'task' | 'event' | 'note';
export type TaskStatus = 'open' | 'completed' | 'migrated' | 'cancelled' | 'scheduled';
// 'from-monthly'는 레거시 데이터 호환용으로만 유지(더 이상 생성되지 않음)
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
}

export interface FutureEntry extends BaseEntry {
  year: number;
  month: number;
  // scheduledDate 없음 — Future Log는 월 단위 기록만
}

// ── Routine ───────────────────────────────────────────────
export type RoutineDayStatus = 'success' | 'fail';

export interface Routine {
  id: string;
  name: string;
  color?: string;      // 표시용(선택)
  order: number;       // 목록 정렬용
  createdAt: string;
}

// 루틴의 특정 날짜 달성 기록. id = `${routineId}_${date}`
export interface RoutineLog {
  id: string;
  routineId: string;
  date: string;        // YYYY-MM-DD
  status: RoutineDayStatus;
}
