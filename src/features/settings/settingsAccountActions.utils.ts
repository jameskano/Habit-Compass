import type { AccountProviderClassification } from '@/domain/auth'

export const accountDeletionRequiresPassword = (
  providerClassification: AccountProviderClassification | undefined,
) => providerClassification === 'email_password' || providerClassification === 'mixed'
