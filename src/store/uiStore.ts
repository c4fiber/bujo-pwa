import { create } from 'zustand'
import { format } from 'date-fns'

interface UIStore {
  activeYear: number
  activeMonth: number
  activeDate: string  // YYYY-MM-DD
  setActiveYear: (year: number) => void
  setActiveMonth: (month: number) => void
  setActiveDate: (date: string) => void
}

const today = new Date()

export const useUIStore = create<UIStore>((set) => ({
  activeYear: today.getFullYear(),
  activeMonth: today.getMonth() + 1,
  activeDate: format(today, 'yyyy-MM-dd'),
  setActiveYear: (year) => set({ activeYear: year }),
  setActiveMonth: (month) => set({ activeMonth: month }),
  setActiveDate: (date) => set({ activeDate: date }),
}))
