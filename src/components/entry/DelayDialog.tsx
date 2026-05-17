import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays } from 'date-fns'

interface Props {
  open: boolean
  onConfirm: (date: string) => void
  onClose: () => void
}

export function DelayDialog({ open, onConfirm, onClose }: Props) {
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))

  const handleConfirm = () => {
    if (!date) return
    onConfirm(date)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto bg-surface-1 border-t border-surface-2 rounded-t-2xl p-5 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="w-8 h-1 bg-surface-3 rounded-full mx-auto mb-5" />
            <p className="text-xs font-mono text-zinc-500 mb-1">DEFER TASK</p>
            <p className="text-sm text-zinc-300 mb-4">연기할 날짜를 선택하세요</p>

            <input
              type="date"
              className="w-full bg-surface-2 text-white rounded-lg px-3 py-2.5 text-sm font-mono outline-none border border-surface-3 focus:border-accent-amber transition-colors"
              value={date}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={e => setDate(e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirm}
                disabled={!date}
                className="flex-1 py-2.5 rounded-xl bg-accent-amber/20 text-accent-amber border border-accent-amber/30 text-sm font-mono hover:bg-accent-amber/30 disabled:opacity-40 transition-colors"
              >
                &lt; 연기
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
