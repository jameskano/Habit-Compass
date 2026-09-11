import { fireEvent, render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { emptySubscriptionSnapshot } from '@/domain/subscriptions'
import { getMessages } from '@/i18n/messages'
import {
  clearNativeBackHandlersForTest,
  runNativeBackHandlers,
} from '@/shared/nativeBack/nativeBackRegistry'

import { DeleteAccountDialog } from './DeleteAccountDialog'

describe('DeleteAccountDialog', () => {
  afterEach(() => clearNativeBackHandlersForTest())

  it('announces deletion progress and blocks backdrop, escape, and native-back dismissal', () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <DeleteAccountDialog
          deleteError={false}
          deletePassword=""
          deleteReauthMethod="google"
          googleReauthVerified
          isPending
          onDeletePasswordChange={vi.fn()}
          onOpenChange={onOpenChange}
          onRestartGoogleReauthentication={vi.fn()}
          onStepChange={vi.fn()}
          onSubmit={vi.fn()}
          open
          step="confirm"
          subscriptionSnapshot={emptySubscriptionSnapshot}
          subscriptionSnapshotLoading={false}
        />
      </IntlProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Deleting your account' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Deleting your account...')

    fireEvent.keyDown(document, { key: 'Escape' })
    const overlay = container.ownerDocument.querySelector('[data-dialog-overlay]')
    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as Element)
    fireEvent.click(overlay as Element)
    expect(runNativeBackHandlers()).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('keeps a failed Google deletion recoverable with retry and fresh verification actions', () => {
    const onRestartGoogleReauthentication = vi.fn()
    const onSubmit = vi.fn()
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <DeleteAccountDialog
          deleteError
          deletePassword=""
          deleteReauthMethod="google"
          googleReauthVerified
          isPending={false}
          onDeletePasswordChange={vi.fn()}
          onOpenChange={vi.fn()}
          onRestartGoogleReauthentication={onRestartGoogleReauthentication}
          onStepChange={vi.fn()}
          onSubmit={onSubmit}
          open
          step="confirm"
          subscriptionSnapshot={emptySubscriptionSnapshot}
          subscriptionSnapshotLoading={false}
        />
      </IntlProvider>,
    )

    expect(screen.getByText(/couldn't complete account deletion/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete account permanently' }))
    fireEvent.click(screen.getByRole('button', { name: 'Verify with Google again' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onRestartGoogleReauthentication).toHaveBeenCalledTimes(1)
  })
})
