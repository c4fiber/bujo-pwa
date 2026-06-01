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

type JournalSnapshot = Record<string, { id: string; data: any }[]>

// 현재 권한으로 로컬 저널 전체 읽어오기
async function snapshotJournal(journalId: string): Promise<JournalSnapshot> {
  const result: JournalSnapshot = {}
  for (const col of COLLECTIONS) {
    const snap = await getDocs(collection(firestore, `journals/${journalId}/${col}`))
    result[col] = snap.docs.map(d => ({ id: d.id, data: d.data() }))
  }
  return result
}

// 메모리에 보관된 스냅샷을 toId 경로로 기록
async function writeSnapshot(snapshot: JournalSnapshot, toId: string) {
  for (const col of COLLECTIONS) {
    const docs = snapshot[col]
    if (!docs?.length) continue
    const wb = writeBatch(firestore)
    docs.forEach(({ id, data }) =>
      wb.set(doc(firestore, `journals/${toId}/${col}/${id}`), data)
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
          // 1. 익명 권한 유지된 상태에서 로컬 저널 전체 스냅샷
          const localSnapshot = await snapshotJournal(localJournalId)

          // 2. Google 계정으로 sign-in (uid 변경됨)
          const result = await signInWithCredential(auth, credential)
          const newUid = result.user.uid
          const profileRef = doc(firestore, `userJournals/${newUid}`)
          const profileSnap = await getDoc(profileRef)

          if (profileSnap.exists()) {
            const cloudJournalId = profileSnap.data().journalId as string
            if (cloudJournalId !== localJournalId) {
              // 3. 스냅샷을 클라우드 journalId로 기록 (newUid가 cloudJournalId 소유자라 권한 OK)
              await writeSnapshot(localSnapshot, cloudJournalId)
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
