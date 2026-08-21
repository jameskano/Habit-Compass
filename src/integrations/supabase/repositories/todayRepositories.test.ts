import { beforeEach, describe, expect, it, vi } from 'vitest'

import { supabaseHabitsRepository } from './habitsRepository'
import { supabaseRecurrentTasksRepository } from './recurrentTasksRepository'
import { supabaseTasksRepository } from './tasksRepository'

type SupabaseResponse = {
  data: unknown
  error: unknown
}

type QueryBuilder = {
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  then: Promise<SupabaseResponse>['then']
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
    eq: vi.fn(),
    gte: vi.fn(),
    is: vi.fn(),
    lte: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    then: responsePromise.then.bind(responsePromise),
  } as QueryBuilder

  builder.eq.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.is.mockReturnValue(builder)
  builder.lte.mockReturnValue(builder)
  builder.or.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)

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

const baseRow = {
  archived_at: null,
  category_id: null,
  created_at: '2026-07-01T00:00:00.000Z',
  description: null,
  notes: null,
  priority: 'medium',
  sort_order: 0,
  title: 'Candidate',
  updated_at: '2026-07-01T00:00:00.000Z',
  user_id: 'signed-user',
}

const taskRow = {
  ...baseRow,
  carry_forward: true,
  completed_at: null,
  due_date: '2026-07-14',
  id: 'task-today',
  status: 'pending',
}

const dailyHabitRow = {
  ...baseRow,
  ends_on: null,
  goal_config: { trackingType: 'binary' },
  id: 'habit-daily',
  minimum_config: null,
  schedule_config: { kind: 'daily' },
  starts_on: '2026-07-01',
  tracking_type: 'binary',
}

const mondayHabitRow = {
  ...dailyHabitRow,
  id: 'habit-monday',
  schedule_config: { daysOfWeek: [1], kind: 'specificDaysOfWeek' },
}

const dailyRecurrentTaskRow = {
  ...baseRow,
  carry_forward: false,
  ends_on: null,
  id: 'recurrent-daily',
  recurrence_config: { kind: 'daily' },
  starts_on: '2026-07-01',
}

const storedOccurrenceRow = {
  completed_at: null,
  created_at: '2026-07-01T00:00:00.000Z',
  id: 'recurrent-log-today',
  occurrence_date: '2026-07-14',
  recurrent_task_id: 'recurrent-daily',
  status: 'pending',
  updated_at: '2026-07-01T00:00:00.000Z',
  user_id: 'signed-user',
}

describe('Supabase Today repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('loads only active task candidates for the selected date', async () => {
    const client = mockSupabase({ data: [taskRow], error: null })

    const result = await supabaseTasksRepository.listForToday({
      userId: 'mock-user',
      date: '2026-07-14',
    })

    expect(result.ok && result.data.map((task) => task.id)).toEqual(['task-today'])
    expect(client.from).toHaveBeenCalledWith('tasks')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[0].is).toHaveBeenCalledWith('archived_at', null)
    expect(testState.builders[0].or).toHaveBeenCalledWith(
      'due_date.eq.2026-07-14,and(due_date.lt.2026-07-14,carry_forward.eq.true,status.eq.pending)',
    )
    expect(testState.builders[0].order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })

  it('loads active habit candidates and keeps schedule filtering in TypeScript', async () => {
    mockSupabase({ data: [dailyHabitRow, mondayHabitRow], error: null })

    const result = await supabaseHabitsRepository.listForToday({
      userId: 'mock-user',
      date: '2026-07-14',
    })

    expect(result.ok && result.data.map((habit) => habit.id)).toEqual(['habit-daily'])
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[0].is).toHaveBeenCalledWith('archived_at', null)
    expect(testState.builders[0].lte).toHaveBeenCalledWith('starts_on', '2026-07-14')
    expect(testState.builders[0].or).toHaveBeenCalledWith('ends_on.is.null,ends_on.gte.2026-07-14')
  })

  it('loads active recurrent task candidates before deriving selected-date occurrences', async () => {
    const client = mockSupabase(
      { data: [dailyRecurrentTaskRow], error: null },
      { data: [storedOccurrenceRow], error: null },
    )

    const result = await supabaseRecurrentTasksRepository.listForToday({
      userId: 'mock-user',
      date: '2026-07-14',
    })

    expect(result.ok && result.data.map((occurrence) => occurrence.id)).toEqual([
      'recurrent-log-today',
    ])
    expect(client.from).toHaveBeenNthCalledWith(1, 'recurrent_tasks')
    expect(client.from).toHaveBeenNthCalledWith(2, 'recurrent_task_logs')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[0].is).toHaveBeenCalledWith('archived_at', null)
    expect(testState.builders[0].lte).toHaveBeenCalledWith('starts_on', '2026-07-14')
    expect(testState.builders[0].or).toHaveBeenCalledWith('ends_on.is.null,ends_on.gte.2026-07-14')
    expect(testState.builders[1].gte).toHaveBeenCalledWith('occurrence_date', '2026-07-14')
    expect(testState.builders[1].lte).toHaveBeenCalledWith('occurrence_date', '2026-07-14')
  })
})
