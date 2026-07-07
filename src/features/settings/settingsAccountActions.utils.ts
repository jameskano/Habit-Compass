import type { UserAccountCapabilities } from '@/domain/auth'

export const accountDeletionRequiresPassword = (
  accountCapabilities: UserAccountCapabilities | undefined,
) => accountCapabilities?.passwordEnabled === true
