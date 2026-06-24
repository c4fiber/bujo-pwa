import { describe, it, expect } from 'vitest'
import {
  toDateString, fromDateString, parseDate,
  nextDay, prevDay, nextMonth, prevMonth,
} from './dateUtils'

describe('toDateString / fromDateString', () => {
  it('Date를 yyyy-MM-dd 문자열로 변환한다', () => {
    expect(toDateString(new Date(2026, 5, 12))).toBe('2026-06-12')
  })

  it('왕복 변환이 일치한다', () => {
    const d = fromDateString('2026-06-12')
    expect(toDateString(d)).toBe('2026-06-12')
  })
})

describe('parseDate', () => {
  it('날짜 문자열을 year/month/day로 분해한다', () => {
    expect(parseDate('2026-06-12')).toEqual({ year: 2026, month: 6, day: 12 })
  })
})

describe('nextDay / prevDay', () => {
  it('하루 뒤/앞 날짜를 계산한다', () => {
    expect(nextDay('2026-06-12')).toBe('2026-06-13')
    expect(prevDay('2026-06-12')).toBe('2026-06-11')
  })

  it('월 경계를 넘어간다', () => {
    expect(nextDay('2026-06-30')).toBe('2026-07-01')
    expect(prevDay('2026-07-01')).toBe('2026-06-30')
  })
})

describe('nextMonth / prevMonth', () => {
  it('다음/이전 달을 계산한다', () => {
    expect(nextMonth(2026, 6)).toEqual({ year: 2026, month: 7 })
    expect(prevMonth(2026, 6)).toEqual({ year: 2026, month: 5 })
  })

  it('연도 경계를 넘어간다', () => {
    expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 })
    expect(prevMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
  })
})
