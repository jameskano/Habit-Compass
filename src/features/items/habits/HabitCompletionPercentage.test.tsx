import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createHabit, createHabitLog } from '@/domain/habits/logic/habitFixtures'
import type { ISODateString } from '@/shared/types'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitCard } from './HabitCard'
import { HabitStatsTab } from './HabitStatsTab'

describe('habit completion percentage surfaces', () => {
  it('shows the same lifetime percentage on the Items card and Stats tab', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      { startsOn: '2026-05-01', scheduleRule: { kind: 'daily' } },
    )
    const logs = [
      createHabitLog({ id: 'historical', loggedForDate: '2026-05-01' }),
      createHabitLog({ id: 'recent', loggedForDate: '2026-05-20' }),
    ]
    const dates = [
      '2026-05-15',
      '2026-05-16',
      '2026-05-17',
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
    ] as ISODateString[]

    renderWithAppProviders(
      <>
        <HabitCard
          habit={habit}
          logs={logs}
          dates={dates}
          today="2026-05-21"
          archived={false}
          onOpenOptions={vi.fn()}
          onOpenCalendar={vi.fn()}
          onSwipeEdit={vi.fn()}
          onSwipeArchive={vi.fn()}
        />
        <HabitStatsTab habit={habit} logs={logs} today="2026-05-21" />
      </>,
    )

    expect(screen.getAllByText('10%')).toHaveLength(2)
  })
})
