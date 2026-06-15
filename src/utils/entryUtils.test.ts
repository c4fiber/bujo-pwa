import { describe, it, expect } from 'vitest'
import { createMonthlyEntry, createDailyEntry, createFutureEntry } from './entryUtils'

describe('createMonthlyEntry', () => {
  it('날짜를 선택하면 scheduledDate를 단일 날짜로 저장한다', () => {
    const entry = createMonthlyEntry('회의 준비', 'task', 2026, 6, '2026-06-20')
    expect(entry.scheduledDate).toBe('2026-06-20')
    expect(entry.year).toBe(2026)
    expect(entry.month).toBe(6)
  })

  it('날짜를 선택하지 않으면 scheduledDate가 없다', () => {
    const entry = createMonthlyEntry('메모', 'note', 2026, 6)
    expect(entry.scheduledDate).toBeUndefined()
  })

  it('task 타입은 taskStatus가 open으로 초기화된다', () => {
    const task = createMonthlyEntry('할 일', 'task', 2026, 6)
    expect(task.taskStatus).toBe('open')
  })

  it('note 타입은 taskStatus가 없다', () => {
    const note = createMonthlyEntry('메모', 'note', 2026, 6)
    expect(note.taskStatus).toBeUndefined()
  })

  it('고유 id를 부여한다', () => {
    const a = createMonthlyEntry('a', 'note', 2026, 6)
    const b = createMonthlyEntry('b', 'note', 2026, 6)
    expect(a.id).not.toBe(b.id)
  })
})

describe('createDailyEntry', () => {
  it('날짜 문자열로부터 year/month/day를 파싱한다', () => {
    const entry = createDailyEntry('운동', 'event', '2026-06-12')
    expect(entry.year).toBe(2026)
    expect(entry.month).toBe(6)
    expect(entry.day).toBe(12)
    expect(entry.date).toBe('2026-06-12')
    expect(entry.origin).toBe('manual')
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
