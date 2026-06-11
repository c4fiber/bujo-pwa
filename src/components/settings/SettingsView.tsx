import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useSyncStore } from '../../store/syncStore'

export function SettingsView() {
  const { isAnonymous, displayName, email, photoURL, migrating, linkWithGoogle, signOut, journalId } =
    useAuthStore()
  const { lastSyncedAt, syncing, syncError, sync, canSync, nextSyncAvailableAt } = useSyncStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [, forceUpdate] = useState(0)

  // 쿨다운 카운트다운 갱신
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const handleLinkGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await linkWithGoogle()
    } catch (e: any) {
      setError(e.message ?? 'Google 연결 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    await signOut()
  }

  return (
    <div className="flex flex-col h-full p-5 gap-6">
      <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Settings</h2>

      {/* 계정 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-1 rounded-xl p-4 flex items-center gap-4 border border-surface-2"
      >
        {/* 아바타 */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
          {photoURL ? (
            <img src={photoURL} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-zinc-500">{isAnonymous ? '◎' : '●'}</span>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">
            {displayName ?? (isAnonymous ? '익명 사용자' : '사용자')}
          </p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {email ?? '로컬 데이터만 저장 중'}
          </p>
          <span
            className={`inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isAnonymous
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-blue-900/40 text-accent-blue'
            }`}
          >
            {isAnonymous ? 'anonymous' : 'google'}
          </span>
        </div>
      </motion.div>

      {/* 마이그레이션 진행 중 */}
      {migrating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-1 border border-surface-2 rounded-xl p-4 text-sm text-zinc-400 flex items-center gap-3"
        >
          <span className="animate-spin text-lg">◌</span>
          <span>데이터 이전 중…</span>
        </motion.div>
      )}

      {/* 에러 */}
      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 액션 */}
      <div className="flex flex-col gap-2">
        {isAnonymous ? (
          <button
            onClick={handleLinkGoogle}
            disabled={loading || migrating}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-100 disabled:opacity-50 transition-colors"
          >
            <GoogleIcon />
            Google 계정으로 연결
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl bg-surface-2 text-zinc-400 text-sm hover:bg-surface-3 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>

      {isAnonymous && (
        <p className="text-xs text-zinc-600 leading-relaxed">
          Google 계정을 연결하면 기존 데이터가 유지된 채로 기기 간 동기화가 활성화됩니다.
        </p>
      )}

      {/* 동기화 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-1 rounded-xl p-4 flex flex-col gap-3 border border-surface-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Sync</span>
          {syncing && <span className="text-xs text-accent-blue animate-pulse">동기화 중…</span>}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">마지막 동기화</p>
            <p className="text-sm text-white mt-0.5">
              {lastSyncedAt ? formatRelative(lastSyncedAt) : '동기화 기록 없음'}
            </p>
          </div>
          <button
            onClick={() => sync(journalId)}
            disabled={!canSync() || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 text-xs text-zinc-300 hover:bg-surface-3 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SyncIcon spinning={syncing} />
            지금 동기화
          </button>
        </div>

        {/* 쿨다운 안내 */}
        {nextSyncAvailableAt() !== null && (
          <p className="text-[11px] text-zinc-600">
            다음 동기화 가능: {formatRelative(nextSyncAvailableAt()!)}
            &nbsp;(10분 제한)
          </p>
        )}

        {/* 동기화 에러 */}
        {syncError && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
            {syncError}
          </p>
        )}
      </motion.div>
    </div>
  )
}

function formatRelative(epochMs: number): string {
  const diff = Date.now() - epochMs
  if (diff < 0) {
    const abs = Math.abs(diff)
    const mins = Math.ceil(abs / 60_000)
    return `${mins}분 후`
  }
  if (diff < 60_000) return '방금 전'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`
  return new Date(epochMs).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
