import { doc } from 'firebase/firestore'
import { firestore } from './firebase'
import { setDoc } from './syncedFirestore'
import type { BulletType, MonthlyEntry } from '../types/journal'
import { createMonthlyEntry, dailyEntryFromMonthly } from '../utils/entryUtils'

interface CreateMonthlyLogInput {
  content: string
  bulletType: BulletType
  year: number
  month: number
  scheduledDate?: string
}

// Monthly Log 생성의 단일 진입점(trigger).
// Monthly Log를 만들며, scheduledDate(월.일)가 있으면 Monthly Log의 로직에 따라
// 해당 날짜의 Daily Log 항목도 함께 생성/표현한다.
// 다른 로그(예: Future >)는 이 함수만 호출하고 Daily 생성에 관여하지 않는다.
export async function createMonthlyLog(
  journalId: string,
  { content, bulletType, year, month, scheduledDate }: CreateMonthlyLogInput,
): Promise<MonthlyEntry> {
  const monthly = createMonthlyEntry(content, bulletType, year, month, scheduledDate)
  await setDoc(doc(firestore, `journals/${journalId}/monthlyLogs/${monthly.id}`), monthly)

  if (scheduledDate) {
    const daily = dailyEntryFromMonthly(monthly, scheduledDate)
    await setDoc(doc(firestore, `journals/${journalId}/dailyLogs/${daily.id}`), daily)
  }

  return monthly
}
