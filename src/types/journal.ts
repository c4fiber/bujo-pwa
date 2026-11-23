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

// ── Collection (업무/고객사별 진행 목록) ──────────────────────
export interface Collection {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export type CollectionItemStatus = 'open' | 'in_progress' | 'done';

export interface CollectionItem {
  id: string;
  collectionId: string;
  content: string;
  status: CollectionItemStatus;
  // 과거 체크박스(boolean) 데이터 호환용 — status가 없을 때만 참조
  checked?: boolean;
  order: number;
  createdAt: string;
}

