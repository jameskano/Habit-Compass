import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { SuggestionCard } from './SuggestionCard'

describe('SuggestionCard', () => {
  it('runs the primary action and optional dismiss action with accessible names', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onDismiss = vi.fn()

    renderWithAppProviders(
      <SuggestionCard
        titleId="page.today.suggestion.title"
        descriptionId="page.today.suggestion.description"
        actionId="page.today.suggestion.action"
        dismissLabelId="page.today.suggestion.dismiss"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Make today easier to finish' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use a minimum version' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss suggestion' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
