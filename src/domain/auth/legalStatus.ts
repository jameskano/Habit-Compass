import type { CurrentLegalStatus } from './types'

export const legalStatusRequiresAcceptance = (status: CurrentLegalStatus) => !status.accepted
