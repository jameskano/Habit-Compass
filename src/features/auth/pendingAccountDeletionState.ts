const storageKey = 'habit-compass:pending-account-deletion:v1'
const ttlMs = 5 * 60 * 1000

export type PendingAccountDeletionState = {
  createdAt: number
  idempotencyKey: string
  originalUserId: string
}

const getStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage)

const isFresh = (state: PendingAccountDeletionState) => Date.now() - state.createdAt <= ttlMs

export const savePendingAccountDeletionState = (
  state: Omit<PendingAccountDeletionState, 'createdAt'>,
) => {
  getStorage()?.setItem(storageKey, JSON.stringify({ ...state, createdAt: Date.now() }))
}

export const readPendingAccountDeletionState = () => {
  const raw = getStorage()?.getItem(storageKey)

  if (!raw) {
    return null
  }

  try {
    const state = JSON.parse(raw) as PendingAccountDeletionState

    if (!isFresh(state)) {
      clearPendingAccountDeletionState()
      return null
    }

    return state
  } catch {
    clearPendingAccountDeletionState()
    return null
  }
}

export const clearPendingAccountDeletionState = () => {
  getStorage()?.removeItem(storageKey)
}
