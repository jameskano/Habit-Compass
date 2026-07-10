import { beforeEach, describe, expect, it, vi } from 'vitest'

import { supabasePlanningRepository } from './planningRepository'

type SupabaseResponse = {
  data: unknown
  error: unknown
}

type QueryBuilder = {
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
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
    delete: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    maybeSingle: vi.fn(() => responsePromise),
    order: vi.fn(),
    select: vi.fn(),
    single: vi.fn(() => responsePromise),
    update: vi.fn(),
    then: responsePromise.then.bind(responsePromise),
  } as QueryBuilder

  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)

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

const weeklyPlanRow = {
  id: 'weekly-plan-1',
  user_id: 'signed-user',
  week_start: '2026-07-06',
  focus_text: 'Keep the basics',
  review_overall_feeling: 'good',
  review_went_well: 'Sleep improved',
  review_got_in_way: 'Too many evenings out',
  review_adjust_next_week: 'Protect bedtime',
  review_reflections: 'A lighter plan helped.',
  archived_at: '2026-07-08T10:00:00.000Z',
  deleted_at: null,
  created_at: '2026-07-06T00:00:00.000Z',
  updated_at: '2026-07-08T10:00:00.000Z',
}

const weeklyBigRockRow = {
  id: 'weekly-big-rock-1',
  user_id: 'signed-user',
  weekly_plan_id: 'weekly-plan-1',
  habit_id: 'habit-1',
  sort_order: 0,
  archived_at: null,
  deleted_at: null,
  created_at: '2026-07-06T00:00:00.000Z',
  updated_at: '2026-07-06T00:00:00.000Z',
}

describe('supabasePlanningRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('returns null for a missing weekly plan', async () => {
    const client = mockSupabase({ data: null, error: null })

    const result = await supabasePlanningRepository.getForWeek({
      userId: 'mock-user',
      weekStartDate: '2026-07-06',
    })

    expect(result).toEqual({ ok: true, data: null })
    expect(client.from).toHaveBeenCalledWith('weekly_plans')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('week_start', '2026-07-06')
    expect(testState.builders[0].maybeSingle).toHaveBeenCalled()
  })

  it('maps an existing weekly plan with focus, review, archive, and delete fields', async () => {
    mockSupabase({ data: weeklyPlanRow, error: null })

    const result = await supabasePlanningRepository.getForWeek({
      userId: 'mock-user',
      weekStartDate: '2026-07-06',
    })

    expect(result.ok && result.data).toMatchObject({
      id: 'weekly-plan-1',
      userId: 'signed-user',
      weekStartDate: '2026-07-06',
      focusText: 'Keep the basics',
      reviewOverallFeeling: 'good',
      reviewWentWell: 'Sleep improved',
      reviewGotInWay: 'Too many evenings out',
      reviewAdjustNextWeek: 'Protect bedtime',
      reviewReflections: 'A lighter plan helped.',
      archivedAt: '2026-07-08T10:00:00.000Z',
      deletedAt: null,
    })
  })

  it('creates weekly plans with the expected snake_case payload', async () => {
    mockSupabase({ data: weeklyPlanRow, error: null })

    const result = await supabasePlanningRepository.create({
      userId: 'mock-user',
      weekStartDate: '2026-07-06',
      focusText: 'Keep the basics',
      reviewOverallFeeling: 'good',
      reviewWentWell: 'Sleep improved',
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
      reviewReflections: 'A lighter plan helped.',
    })

    expect(result.ok).toBe(true)
    expect(testState.builders[0].insert).toHaveBeenCalledWith({
      user_id: 'signed-user',
      week_start: '2026-07-06',
      focus_text: 'Keep the basics',
      review_overall_feeling: 'good',
      review_went_well: 'Sleep improved',
      review_got_in_way: null,
      review_adjust_next_week: null,
      review_reflections: 'A lighter plan helped.',
    })
  })

  it('updates weekly plans with the expected snake_case payload', async () => {
    mockSupabase({ data: weeklyPlanRow, error: null })

    const result = await supabasePlanningRepository.update({
      id: 'weekly-plan-1',
      focusText: 'Updated focus',
      reviewOverallFeeling: null,
      reviewGotInWay: 'Travel',
      deletedAt: null,
    })

    expect(result.ok).toBe(true)
    expect(testState.builders[0].update).toHaveBeenCalledWith({
      focus_text: 'Updated focus',
      review_overall_feeling: null,
      review_got_in_way: 'Travel',
      deleted_at: null,
    })
    expect(testState.builders[0].eq).toHaveBeenCalledWith('user_id', 'signed-user')
    expect(testState.builders[0].eq).toHaveBeenCalledWith('id', 'weekly-plan-1')
  })

  it('sends lifecycle patches for archive, soft delete, and restore', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-09T12:00:00.000Z'))
    mockSupabase(
      { data: { ...weeklyPlanRow, archived_at: '2026-07-09T12:00:00.000Z' }, error: null },
      { data: { ...weeklyPlanRow, deleted_at: '2026-07-09T12:00:00.000Z' }, error: null },
      { data: { ...weeklyPlanRow, archived_at: null, deleted_at: null }, error: null },
    )

    await supabasePlanningRepository.archive({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
    })
    await supabasePlanningRepository.softDelete({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
    })
    await supabasePlanningRepository.restore({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
    })

    expect(testState.builders[0].update).toHaveBeenCalledWith({
      archived_at: '2026-07-09T12:00:00.000Z',
    })
    expect(testState.builders[1].update).toHaveBeenCalledWith({
      deleted_at: '2026-07-09T12:00:00.000Z',
    })
    expect(testState.builders[2].update).toHaveBeenCalledWith({
      archived_at: null,
      deleted_at: null,
    })
    vi.useRealTimers()
  })

  it('lists Big Rocks in repository order', async () => {
    const secondBigRock = {
      ...weeklyBigRockRow,
      id: 'weekly-big-rock-2',
      habit_id: 'habit-2',
      sort_order: 1,
      deleted_at: '2026-07-10T00:00:00.000Z',
    }
    mockSupabase({ data: [weeklyBigRockRow, secondBigRock], error: null })

    const result = await supabasePlanningRepository.listBigRocks({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
    })

    expect(result.ok && result.data).toEqual([
      {
        id: 'weekly-big-rock-1',
        userId: 'signed-user',
        weeklyPlanId: 'weekly-plan-1',
        habitId: 'habit-1',
        sortOrder: 0,
        archivedAt: null,
        deletedAt: null,
        createdAt: '2026-07-06T00:00:00.000Z',
        updatedAt: '2026-07-06T00:00:00.000Z',
      },
      {
        id: 'weekly-big-rock-2',
        userId: 'signed-user',
        weeklyPlanId: 'weekly-plan-1',
        habitId: 'habit-2',
        sortOrder: 1,
        archivedAt: null,
        deletedAt: '2026-07-10T00:00:00.000Z',
        createdAt: '2026-07-06T00:00:00.000Z',
        updatedAt: '2026-07-06T00:00:00.000Z',
      },
    ])
    expect(testState.builders[0].order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })

  it('computes the next Big Rock sort order before insert', async () => {
    mockSupabase(
      {
        data: [
          weeklyBigRockRow,
          { ...weeklyBigRockRow, id: 'weekly-big-rock-2', sort_order: 1 },
        ],
        error: null,
      },
      {
        data: { ...weeklyBigRockRow, id: 'weekly-big-rock-3', habit_id: 'habit-3', sort_order: 2 },
        error: null,
      },
    )

    const result = await supabasePlanningRepository.addBigRock({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
      habitId: 'habit-3',
    })

    expect(result.ok && result.data.sortOrder).toBe(2)
    expect(testState.builders[1].insert).toHaveBeenCalledWith({
      user_id: 'signed-user',
      weekly_plan_id: 'weekly-plan-1',
      habit_id: 'habit-3',
      sort_order: 2,
    })
  })

  it('returns not found when removing a missing Big Rock', async () => {
    mockSupabase({ data: null, error: null })

    const result = await supabasePlanningRepository.removeBigRock({
      userId: 'mock-user',
      weeklyPlanId: 'weekly-plan-1',
      habitId: 'habit-missing',
    })

    expect(result.ok).toBe(false)
    expect(result.ok ? null : result.error.code).toBe('not_found')
    expect(testState.builders[0].delete).toHaveBeenCalled()
    expect(testState.builders[0].select).toHaveBeenCalledWith('id')
  })
})
