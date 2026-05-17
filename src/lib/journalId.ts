import { nanoid } from 'nanoid'

const KEY = 'bujo_journal_id'

export function getOrCreateJournalId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = nanoid(16)
    localStorage.setItem(KEY, id)
  }
  return id
}

export function setJournalId(id: string) {
  localStorage.setItem(KEY, id)
}
