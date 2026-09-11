const storageKey = 'habit-compass:account-deletion-success:v1'
const ttlMs = 10 * 1000

type AccountDeletionSuccessState = {
  createdAt: number
}

const getStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage)

export const saveAccountDeletionSuccessState = () => {
  getStorage()?.setItem(storageKey, JSON.stringify({ createdAt: Date.now() }))
}

export const readAccountDeletionSuccessState = () => {
  const raw = getStorage()?.getItem(storageKey)

  if (!raw) {
    return false
  }

  try {
    const state = JSON.parse(raw) as AccountDeletionSuccessState
    const valid = typeof state.createdAt === 'number' && Date.now() - state.createdAt <= ttlMs

    if (!valid) {
      clearAccountDeletionSuccessState()
    }

    return valid
  } catch {
    clearAccountDeletionSuccessState()
    return false
  }
}

export const clearAccountDeletionSuccessState = () => {
  getStorage()?.removeItem(storageKey)
}
