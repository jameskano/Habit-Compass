const storageKey = 'habit-compass:pending-account-deletion:v1'
const ttlMs = 5 * 60 * 1000

export type PendingAccountDeletionPhase = 'awaiting_google' | 'google_verified'

export type PendingAccountDeletionState = {
  createdAt: number
  idempotencyKey: string
  originalUserId: string
  phase: PendingAccountDeletionPhase
  verifiedAt?: number
}

const getStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage)

const isFresh = (state: PendingAccountDeletionState) => {
  const freshnessTimestamp =
    state.phase === 'google_verified' && typeof state.verifiedAt === 'number'
      ? state.verifiedAt
      : state.createdAt

  return Date.now() - freshnessTimestamp <= ttlMs
}

const isPendingAccountDeletionState = (state: unknown): state is PendingAccountDeletionState => {
  if (!state || typeof state !== 'object') {
    return false
  }

  const candidate = state as Partial<PendingAccountDeletionState>

  return (
    typeof candidate.createdAt === 'number' &&
    typeof candidate.idempotencyKey === 'string' &&
    typeof candidate.originalUserId === 'string' &&
    (candidate.phase === 'awaiting_google' ||
      (candidate.phase === 'google_verified' && typeof candidate.verifiedAt === 'number'))
  )
}

export const savePendingAccountDeletionState = (
  state: Omit<PendingAccountDeletionState, 'createdAt' | 'phase' | 'verifiedAt'>,
) => {
  getStorage()?.setItem(
    storageKey,
    JSON.stringify({ ...state, createdAt: Date.now(), phase: 'awaiting_google' }),
  )
}

export const readPendingAccountDeletionState = () => {
  const raw = getStorage()?.getItem(storageKey)

  if (!raw) {
    return null
  }

  try {
    const state = JSON.parse(raw) as unknown

    if (!isPendingAccountDeletionState(state) || !isFresh(state)) {
      clearPendingAccountDeletionState()
      return null
    }

    return state
  } catch {
    clearPendingAccountDeletionState()
    return null
  }
}

export const markPendingAccountDeletionGoogleVerified = () => {
  const state = readPendingAccountDeletionState()

  if (!state || state.phase !== 'awaiting_google') {
    return null
  }

  const verifiedState: PendingAccountDeletionState = {
    ...state,
    phase: 'google_verified',
    verifiedAt: Date.now(),
  }
  getStorage()?.setItem(storageKey, JSON.stringify(verifiedState))
  return verifiedState
}

export const clearPendingAccountDeletionState = () => {
  getStorage()?.removeItem(storageKey)
}
