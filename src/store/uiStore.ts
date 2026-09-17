import { create } from 'zustand'
import { format } from 'date-fns'

interface UIStore {
  activeYear: number
  activeMonth: number
  activeDate: string  // YYYY-MM-DD
  setActiveYear: (year: number) => void
  setActiveMonth: (month: number) => void
  setActiveDate: (date: string) => void
  // Daily 탭 재터치 시 오늘로 이동시키는 신호(증가 카운터)
  dailyHome: number
  goDailyHome: () => void
}

const today = new Date()

export const useUIStore = create<UIStore>((set) => ({
  activeYear: today.getFullYear(),
  activeMonth: today.getMonth() + 1,
  activeDate: format(today, 'yyyy-MM-dd'),
  setActiveYear: (year) => set({ activeYear: year }),
  setActiveMonth: (month) => set({ activeMonth: month }),
  setActiveDate: (date) => set({ activeDate: date }),
  dailyHome: 0,
  goDailyHome: () => set((s) => ({ dailyHome: s.dailyHome + 1 })),
}))
