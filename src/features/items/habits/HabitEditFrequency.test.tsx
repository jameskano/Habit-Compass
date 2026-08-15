import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createHabit } from '@/domain/habits/logic/habitFixtures'
import { cloneMockState, mockData } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitEditTab } from './HabitEditTab'

describe('habit edit frequency', () => {
  it.each([
    { trackingType: 'binary' as const },
    {
      trackingType: 'measurablePerSession' as const,
      targetAmount: 30,
      unitLabel: 'minutes',
    },
  ])('uses the canonical certain-days fields for $trackingType habits', (goalConfig) => {
    const categories = cloneMockState().categories
    const habit = createHabit(goalConfig, {
      categoryId: categories[0].id,
      scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 3, period: 'week' },
    })

    renderWithAppProviders(
      <HabitEditTab
        habit={habit}
        categories={categories}
        today={mockData.today}
        archived={false}
        pending={false}
        onSave={vi.fn()}
        onArchive={vi.fn()}
        onRequestDangerAction={vi.fn()}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Frequency' })).toHaveTextContent(
      'Certain days per period',
    )
    expect(screen.getByLabelText('Days')).toHaveValue(3)
    expect(screen.getByRole('combobox', { name: 'Period' })).toHaveTextContent('week')
    expect(screen.queryByText('Flexible period goal')).not.toBeInTheDocument()
  })
})
