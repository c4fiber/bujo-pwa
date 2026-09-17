import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { DailyLogView } from './components/logs/daily/DailyLogView'
import { FutureLogView } from './components/logs/future/FutureLogView'
import { InboxView } from './components/logs/inbox/InboxView'
import { CollectionsView } from './components/logs/collections/CollectionsView'
import { SettingsView } from './components/settings/SettingsView'

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
          <Route path="future" element={<FutureLogView />} />
          <Route path="inbox" element={<InboxView />} />
          <Route path="collections" element={<CollectionsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/daily" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
