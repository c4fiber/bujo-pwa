import { create } from 'zustand'
import {
  signInAnonymously, onAuthStateChanged,
  GoogleAuthProvider, linkWithPopup,
  signInWithCredential, signOut as fbSignOut,
} from 'firebase/auth'
import {
  collection, doc, getDoc, getDocs, setDoc, writeBatch,
} from 'firebase/firestore'
import { auth, firestore } from '../lib/firebase'
import { getOrCreateJournalId, setJournalId } from '../lib/journalId'

interface AuthStore {
  uid: string | null
  journalId: string
  ready: boolean
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
  migrating: boolean
  linkWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const COLLECTIONS = ['dailyLogs', 'monthlyLogs', 'futureLogs'] as const

// 두 journalId 간 데이터 병합 (from → to, 덮어쓰지 않음)
async function mergeJournals(fromId: string, toId: string) {
  for (const col of COLLECTIONS) {
    const snap = await getDocs(collection(firestore, `journals/${fromId}/${col}`))
    if (snap.empty) continue
    const wb = writeBatch(firestore)
    snap.docs.forEach(d =>
      wb.set(doc(firestore, `journals/${toId}/${col}/${d.id}`), d.data())
    )
    await wb.commit()
  }
}

const googleProvider = new GoogleAuthProvider()

export const useAuthStore = create<AuthStore>((set, get) => ({
  uid: null,
  journalId: getOrCreateJournalId(),
  ready: false,
  isAnonymous: true,
  displayName: null,
  email: null,
  photoURL: null,
  migrating: false,

  linkWithGoogle: async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    const localJournalId = get().journalId

    try {
      // 케이스 1: 처음 Google 연결 — UID 불변, journalId 클라우드에 등록
      await linkWithPopup(currentUser, googleProvider)
      await setDoc(
        doc(firestore, `userJournals/${currentUser.uid}`),
        { journalId: localJournalId },
      )
      const u = auth.currentUser!
      set({ isAnonymous: false, displayName: u.displayName, email: u.email, photoURL: u.photoURL })
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        // 케이스 2: Google 계정 이미 존재 — 클라우드 journalId와 병합
        const credential = GoogleAuthProvider.credentialFromError(err)!
        set({ migrating: true })
        try {
          const result = await signInWithCredential(auth, credential)
          const newUid = result.user.uid
          const profileRef = doc(firestore, `userJournals/${newUid}`)
          const profileSnap = await getDoc(profileRef)

          if (profileSnap.exists()) {
            const cloudJournalId = profileSnap.data().journalId as string
            if (cloudJournalId !== localJournalId) {
              // 로컬 데이터를 클라우드 journalId로 병합 후 로컬 업데이트
              await mergeJournals(localJournalId, cloudJournalId)
              setJournalId(cloudJournalId)
              set({ journalId: cloudJournalId })
            }
          } else {
            await setDoc(profileRef, { journalId: localJournalId })
          }
        } finally {
          set({ migrating: false })
        }
      } else {
        throw err
      }
    }
  },

  signOut: async () => {
    // localStorage journalId는 유지 — 로그아웃 후 새 익명 계정도 동일 데이터 접근 가능
    await fbSignOut(auth)
  },
}))

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    signInAnonymously(auth).catch(console.error)
    return
  }

  const localJournalId = getOrCreateJournalId()
  const profileRef = doc(firestore, `userJournals/${user.uid}`)
  const profileSnap = await getDoc(profileRef)

  let journalId = localJournalId

  if (profileSnap.exists()) {
    // 이미 등록된 계정: 저장된 journalId 사용 (다른 기기에서 로그인 시 동기화)
    journalId = profileSnap.data().journalId as string
    if (journalId !== localJournalId) setJournalId(journalId)
  } else {
    // 처음 보는 uid: 현재 로컬 journalId를 등록
    await setDoc(profileRef, { journalId: localJournalId })
  }

  useAuthStore.setState({
    uid: user.uid,
    journalId,
    ready: true,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  })
})
