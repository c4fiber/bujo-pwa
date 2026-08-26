import { describe, it, expect } from 'vitest'
import { createDailyEntry, createFutureEntry, dailyEntryFromFuture, dailyEntryMovedTo } from './entryUtils'

describe('createDailyEntry', () => {
  it('날짜 문자열로부터 year/month/day를 파싱한다', () => {
    const entry = createDailyEntry('운동', 'event', '2026-06-12')
    expect(entry.year).toBe(2026)
    expect(entry.month).toBe(6)
    expect(entry.day).toBe(12)
    expect(entry.date).toBe('2026-06-12')
    expect(entry.origin).toBe('manual')
  })

  it('task 타입은 taskStatus가 open으로 초기화된다', () => {
    expect(createDailyEntry('할 일', 'task', '2026-06-12').taskStatus).toBe('open')
  })

  it('note 타입은 taskStatus가 없다', () => {
    expect(createDailyEntry('메모', 'note', '2026-06-12').taskStatus).toBeUndefined()
  })
})

describe('createFutureEntry', () => {
  it('연/월 단위로만 저장하고 scheduledDate가 없다', () => {
    const entry = createFutureEntry('휴가 계획', 'task', 2026, 12)
    expect(entry.year).toBe(2026)
    expect(entry.month).toBe(12)
    expect('scheduledDate' in entry).toBe(false)
  })
})

describe('dailyEntryFromFuture', () => {
  it('Future 항목을 특정 날짜의 Daily(from-future)로 복제한다', () => {
    const future = createFutureEntry('발표 준비', 'task', 2026, 7)
    const daily = dailyEntryFromFuture(future, '2026-07-15')
    expect(daily.date).toBe('2026-07-15')
    expect(daily.origin).toBe('from-future')
    expect(daily.sourceId).toBe(future.id)
    expect(daily.id).not.toBe(future.id)
    expect(daily.content).toBe('발표 준비')
  })
})

describe('dailyEntryMovedTo', () => {
  it('다른 날짜로 이동한 항목은 origin migrated + sourceId를 가진다', () => {
    const moved = dailyEntryMovedTo('물 마시기', 'task', '2026-06-20', 'src-1')
    expect(moved.date).toBe('2026-06-20')
    expect(moved.origin).toBe('migrated')
    expect(moved.sourceId).toBe('src-1')
    expect(moved.taskStatus).toBe('open')
  })
})
