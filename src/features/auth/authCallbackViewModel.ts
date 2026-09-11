import type { AuthCallbackFlow } from './authRedirects'

export type AuthCallbackViewModel = {
  descriptionId: string
  processingId: string
  recoveryActionId: string
  recoveryTo: string
  titleId: string
}

const callbackViewModels: Record<AuthCallbackFlow | 'default', AuthCallbackViewModel> = {
  default: {
    descriptionId: 'auth.callback.default.description',
    processingId: 'auth.callback.default.processing',
    recoveryActionId: 'auth.callback.backToSignIn',
    recoveryTo: '/auth/sign-in',
    titleId: 'auth.callback.default.title',
  },
  signup: {
    descriptionId: 'auth.callback.signup.description',
    processingId: 'auth.callback.signup.processing',
    recoveryActionId: 'auth.callback.backToSignUp',
    recoveryTo: '/auth/sign-up',
    titleId: 'auth.callback.signup.title',
  },
  recovery: {
    descriptionId: 'auth.callback.recovery.description',
    processingId: 'auth.callback.recovery.processing',
    recoveryActionId: 'auth.callback.requestReset',
    recoveryTo: '/auth/forgot-password',
    titleId: 'auth.callback.recovery.title',
  },
  'email-change': {
    descriptionId: 'auth.callback.emailChange.description',
    processingId: 'auth.callback.emailChange.processing',
    recoveryActionId: 'auth.callback.returnToSecurity',
    recoveryTo: '/settings/security',
    titleId: 'auth.callback.emailChange.title',
  },
  'delete-account': {
    descriptionId: 'auth.callback.deleteAccount.description',
    processingId: 'auth.callback.deleteAccount.processing',
    recoveryActionId: 'auth.callback.returnToSettings',
    recoveryTo: '/settings',
    titleId: 'auth.callback.deleteAccount.title',
  },
}

export const getAuthCallbackViewModel = (
  flow: AuthCallbackFlow | undefined,
  forceSignInRecovery = false,
): AuthCallbackViewModel => {
  const viewModel = callbackViewModels[flow ?? 'default']

  return forceSignInRecovery
    ? {
        ...viewModel,
        recoveryActionId: 'auth.callback.backToSignIn',
        recoveryTo: '/auth/sign-in',
      }
    : viewModel
}
