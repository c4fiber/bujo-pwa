import { format, parse, addDays, subDays, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

export const toDateString = (date: Date): string => format(date, 'yyyy-MM-dd')

export const fromDateString = (dateStr: string): Date =>
  parse(dateStr, 'yyyy-MM-dd', new Date())

export const formatDisplay = (dateStr: string): string =>
  format(fromDateString(dateStr), 'M월 d일 (EEE)', { locale: ko })

export const formatMonthDisplay = (year: number, month: number): string =>
  format(new Date(year, month - 1, 1), 'yyyy년 M월', { locale: ko })

export const nextDay = (dateStr: string): string =>
  toDateString(addDays(fromDateString(dateStr), 1))

export const prevDay = (dateStr: string): string =>
  toDateString(subDays(fromDateString(dateStr), 1))

export const nextMonth = (year: number, month: number) => {
  const d = addMonths(new Date(year, month - 1, 1), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export const prevMonth = (year: number, month: number) => {
  const d = subMonths(new Date(year, month - 1, 1), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export const parseDate = (dateStr: string) => {
  const d = fromDateString(dateStr)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

export const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
