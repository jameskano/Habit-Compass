import type { CurrentLegalVersions } from '@/domain/auth'

const storageKey = 'habit-compass:pending-auth:v1'
const ttlMs = 15 * 60 * 1000

export type PendingAuthState = {
  createdAt: number
  email?: string
  flow?: 'signup' | 'email-code' | 'recovery'
  legalIntent?: CurrentLegalVersions & {
    locale: 'en' | 'es'
  }
}

const getStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage)

const isFresh = (state: PendingAuthState) => Date.now() - state.createdAt <= ttlMs

export const savePendingAuthState = (state: Omit<PendingAuthState, 'createdAt'>) => {
  getStorage()?.setItem(storageKey, JSON.stringify({ ...state, createdAt: Date.now() }))
}

export const readPendingAuthState = () => {
  const raw = getStorage()?.getItem(storageKey)

  if (!raw) {
    return null
  }

  try {
    const state = JSON.parse(raw) as PendingAuthState

    if (!isFresh(state)) {
      clearPendingAuthState()
      return null
    }

    return state
  } catch {
    clearPendingAuthState()
    return null
  }
}

export const clearPendingAuthState = () => {
  getStorage()?.removeItem(storageKey)
}

export const legalIntentMatches = (
  intent: PendingAuthState['legalIntent'] | undefined,
  versions: CurrentLegalVersions,
) =>
  Boolean(
    intent &&
    intent.currentTermsVersion === versions.currentTermsVersion &&
    intent.currentPrivacyPolicyVersion === versions.currentPrivacyPolicyVersion,
  )
