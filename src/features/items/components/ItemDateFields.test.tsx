import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'

import { DatePickerField, ReadOnlyStartDateField } from './ItemDateFields'

const DatePickerInDialog = () => {
  const [value, setValue] = useState('2026-08-20')

  return (
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">Edit item</DialogTitle>
        <DatePickerField
          labelId="page.items.create.details.endsOn"
          value={value}
          onValueChange={setValue}
          allowClear
          openLabelId="page.items.date.openEndDatePicker"
        />
      </DialogContent>
    </Dialog>
  )
}

describe('item date fields', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens repeatedly inside a modal dialog without a focus-loop error and restores focus', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithAppProviders(<DatePickerInDialog />)

    const trigger = screen.getByRole('button', { name: 'Choose end date' })

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await user.click(trigger)
      expect(await screen.findByRole('dialog', { name: 'Choose end date' })).toBeInTheDocument()
      expect(await screen.findByRole('grid')).toBeInTheDocument()

      const nextMonth = screen.getByRole('button', { name: /next month/i })
      await user.click(nextMonth)
      expect(screen.getByRole('grid')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument())
      await waitFor(() => expect(trigger).toHaveFocus())
    }

    expect(consoleError).not.toHaveBeenCalled()
  })

  it('renders the immutable start date as non-interactive information', () => {
    renderWithAppProviders(
      <ReadOnlyStartDateField labelId="page.items.habit.edit.startsOn" value="2026-08-20" />,
    )

    expect(screen.getByText('Start date')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Start date' })).toHaveTextContent('20/08/2026')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
