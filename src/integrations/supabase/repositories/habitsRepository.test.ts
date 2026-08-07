import { beforeEach, describe, expect, it, vi } from 'vitest'

import { supabaseHabitsRepository } from './habitsRepository'

type SupabaseResponse = {
  data: unknown
  error: unknown
}

type QueryBuilder = {
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: Promise<SupabaseResponse>['then']
  update: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
}

const testState = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  builders: [] as QueryBuilder[],
}))

vi.mock('../client', () => ({
  getSupabaseClient: () => testState.getSupabaseClient(),
}))

const createBuilder = (response: SupabaseResponse): QueryBuilder => {
  const responsePromise = Promise.resolve(response)
  const builder = {
    delete: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(() => responsePromise),
    select: vi.fn(),
    single: vi.fn(() => responsePromise),
    then: responsePromise.then.bind(responsePromise),
    update: vi.fn(),
    upsert: vi.fn(),
  } as QueryBuilder

  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)

  return builder
}

const mockSupabase = (...responses: SupabaseResponse[]) => {
  testState.builders.length = 0
  const queuedBuilders = responses.map(createBuilder)
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'signed-user' } },
        error: null,
      }),
    },
    from: vi.fn(() => {
      const builder = queuedBuilders.shift()
      if (!builder) {
        throw new Error('Unexpected Supabase table query')
      }
      testState.builders.push(builder)
      return builder
    }),
  }

  testState.getSupabaseClient.mockReturnValue(client)
  return client
}

const habitRow = {
  archived_at: null,
  category_id: 'category-one',
  created_at: '2026-07-01T00:00:00.000Z',
  description: null,
  ends_on: '2026-07-10',
  goal_config: { trackingType: 'binary' },
  id: 'habit-one',
  minimum_config: {
    defaultCompletionLevel: 'standard',
    enabledCompletionLevels: ['minimum', 'standard'],
    resetMode: 'soft',
  },
  notes: null,
  priority: 'medium',
  schedule_config: { kind: 'daily' },
  sort_order: 0,
  starts_on: '2026-07-01',
  title: 'Habit 1',
  tracking_type: 'binary',
  updated_at: '2026-07-01T00:00:00.000Z',
  user_id: 'signed-user',
}

const habitLogRow = {
  amount: 45,
  completion_level: null,
  created_at: '2026-07-01T00:00:00.000Z',
  habit_id: 'habit-one',
  id: 'habit-log-one',
  log_date: '2026-07-01',
  logged_at: '2026-07-01T00:00:00.000Z',
  note: null,
  status: 'completed',
  unit_label: 'minutes',
  updated_at: '2026-07-01T00:00:00.000Z',
  user_id: 'signed-user',
}

describe('Supabase habits repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hard resets logs and restarts the signed-in user habit without losing minimum config', async () => {
    const updatedHabitRow = {
      ...habitRow,
      minimum_config: {
        ...habitRow.minimum_config,
        resetMode: 'hard',
      },
      starts_on: '2026-07-10',
    }
    const client = mockSupabase(
      { data: habitRow, error: null },
      { data: null, error: null },
      { data: updatedHabitRow, error: null },
    )

    const result = await supabaseHabitsRepository.hardResetLogs({
      userId: 'ignored-mock-user',
      habitId: 'habit-one',
      confirmed: true,
      resetDate: '2026-07-14',
    })

    expect(result.ok && result.data.startsOn).toBe('2026-07-10')
    expect(result.ok && result.data.resetMode).toBe('hard')
    expect(client.from).toHaveBeenNthCalledWith(1, 'habits')
    expect(client.from).toHaveBeenNthCalledWith(2, 'habit_logs')
    expect(client.from).toHaveBeenNthCalledWith(3, 'habits')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('id', 'habit-one')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[1].delete).toHaveBeenCalled()
    expect(testState.builders[1].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[1].eq).toHaveBeenCalledWith('habit_id', 'habit-one')
    expect(testState.builders[2].update).toHaveBeenCalledWith({
      starts_on: '2026-07-10',
      minimum_config: {
        defaultCompletionLevel: 'standard',
        enabledCompletionLevels: ['minimum', 'standard'],
        resetMode: 'hard',
      },
    })
    expect(testState.builders[2].eq).toHaveBeenCalledWith('id', 'habit-one')
    expect(testState.builders[2].eq).toHaveBeenCalledWith('user_id', 'signed-user')
  })

  it('does not hard reset archived habits', async () => {
    const client = mockSupabase({
      data: { ...habitRow, archived_at: '2026-07-12T00:00:00.000Z' },
      error: null,
    })

    const result = await supabaseHabitsRepository.hardResetLogs({
      userId: 'ignored-mock-user',
      habitId: 'habit-one',
      confirmed: true,
      resetDate: '2026-07-14',
    })

    expect(result.ok).toBe(false)
    expect(client.from).toHaveBeenCalledTimes(1)
  })

  it('upserts measurable logs with generic amount fields only', async () => {
    const client = mockSupabase({ data: habitLogRow, error: null })

    const result = await supabaseHabitsRepository.upsertLog({
      userId: 'ignored-mock-user',
      habitId: 'habit-one',
      logDate: '2026-07-01',
      status: 'completed',
      value: 45,
      unitLabel: 'minutes',
    })

    expect(result.ok && result.data.amount).toBe(45)
    expect(result.ok && result.data.unitLabel).toBe('minutes')
    expect(client.from).toHaveBeenCalledWith('habit_logs')
    expect(testState.builders[0].upsert).toHaveBeenCalledWith(
      {
        user_id: 'signed-user',
        habit_id: 'habit-one',
        log_date: '2026-07-01',
        status: 'completed',
        completion_level: null,
        amount: 45,
        unit_label: 'minutes',
        note: null,
      },
      { onConflict: 'user_id,habit_id,log_date' },
    )
  })
})
