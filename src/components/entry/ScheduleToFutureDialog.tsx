import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MONTHS_KO } from '../../utils/dateUtils'

interface Props {
  open: boolean
  onConfirm: (year: number, month: number) => void
  onClose: () => void
  title?: string
  description?: string
  confirmLabel?: string
}

export function ScheduleToFutureDialog({
  open, onConfirm, onClose,
  title = 'SCHEDULE TO FUTURE',
  description = 'Future Log 월을 선택하세요',
  confirmLabel = '< Future로 이동',
}: Props) {
  const now = new Date()
  const defaultMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2
  const defaultYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear()
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const years = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]

  const handleConfirm = () => {
    onConfirm(year, month)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto bg-surface-1 border-t border-surface-2 rounded-t-2xl p-5 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="w-8 h-1 bg-surface-3 rounded-full mx-auto mb-5" />
            <p className="text-xs font-mono text-zinc-500 mb-1">{title}</p>
            <p className="text-sm text-zinc-300 mb-4">{description}</p>

            <div className="flex gap-3 mb-4">
              <select
                className="flex-1 bg-surface-2 text-white rounded-lg px-3 py-2.5 text-sm font-mono outline-none border border-surface-3 focus:border-accent-amber transition-colors"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-surface-1">{y}년</option>
                ))}
              </select>
              <select
                className="flex-1 bg-surface-2 text-white rounded-lg px-3 py-2.5 text-sm font-mono outline-none border border-surface-3 focus:border-accent-amber transition-colors"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
              >
                {MONTHS_KO.map((label, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-surface-1">{label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-accent-amber/20 text-accent-amber border border-accent-amber/30 text-sm font-mono hover:bg-accent-amber/30 transition-colors"
              >
                {confirmLabel}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-surface-2 text-zinc-500 text-sm hover:text-white transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
