import type { LimitedItemKind } from '@/domain/subscriptions'
import { getFreePlanLimitErrorKind } from '@/domain/subscriptions'

export const getItemLimitKindFromError = (error: unknown): LimitedItemKind | null => {
  const details =
    typeof error === 'object' && error !== null && 'details' in error
      ? (error as { details?: unknown }).details
      : null

  if (typeof details === 'object' && details !== null && 'limitKind' in details) {
    const limitKind = (details as { limitKind?: unknown }).limitKind

    if (limitKind === 'habit' || limitKind === 'task' || limitKind === 'recurrentTask') {
      return limitKind
    }
  }

  return getFreePlanLimitErrorKind(error)
}
