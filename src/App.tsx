import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { DailyLogView } from './components/logs/daily/DailyLogView'
import { MonthlyLogView } from './components/logs/monthly/MonthlyLogView'
import { FutureLogView } from './components/logs/future/FutureLogView'
import { SettingsView } from './components/settings/SettingsView'
import { ReviewView } from './components/logs/review/ReviewView'

export default function App() {
  const ready = useAuthStore(s => s.ready)

  if (!ready) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center">
        <span className="font-mono text-zinc-600 text-sm animate-pulse">●</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/daily" replace />} />
          <Route path="daily" element={<DailyLogView />} />
          <Route path="monthly" element={<MonthlyLogView />} />
          <Route path="future" element={<FutureLogView />} />
          <Route path="review" element={<ReviewView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/daily" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
