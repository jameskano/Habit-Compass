import { useNavigate, useSearch } from '@tanstack/react-router'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { PendingState } from '@/shared/ui/PendingState'

import { AuthAlert } from './AuthFormControls'
import { AuthShell } from './AuthShell'
import { getAuthCallbackViewModel } from './authCallbackViewModel'
import { authCallbackFlows, type AuthCallbackFlow, type AuthCallbackSearch } from './authRedirects'
import { useAuthCallbackController } from './useAuthCallbackController'

const getKnownCallbackFlow = (flow: string | undefined): AuthCallbackFlow | undefined =>
  flow && (authCallbackFlows as readonly string[]).includes(flow)
    ? (flow as AuthCallbackFlow)
    : undefined

export const AuthCallbackPage = () => {
  const search = useSearch({ strict: false }) as AuthCallbackSearch
  const navigate = useNavigate()
  const { errorCode, errorMessageId, forceSignInRecovery, processing } =
    useAuthCallbackController(search)
  const viewModel = getAuthCallbackViewModel(getKnownCallbackFlow(search.flow), forceSignInRecovery)
  const hasError = Boolean(errorCode || errorMessageId)

  return (
    <AuthShell titleId={viewModel.titleId} descriptionId={viewModel.descriptionId}>
      <div className="space-y-4">
        {processing ? (
          <PendingState messageId={viewModel.processingId} className="min-h-28 px-0 py-2" />
        ) : null}
        <AuthAlert errorCode={errorCode} messageId={errorMessageId ?? undefined} />
        {!processing && hasError ? (
          <Button
            className="w-full"
            onClick={() => void navigate({ replace: true, to: viewModel.recoveryTo as never })}
          >
            <FormattedMessage id={viewModel.recoveryActionId} />
          </Button>
        ) : null}
      </div>
    </AuthShell>
  )
}
