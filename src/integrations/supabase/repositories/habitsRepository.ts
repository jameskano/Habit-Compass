import {
  isHabitScheduledOnDate,
  type Habit,
  type HabitLog,
  type HabitsRepository,
} from '@/domain/habits'
import type { HabitAmountUnit } from '@/domain/habits/logic/habitDayInteractions'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import {
  executeSupabaseOperation,
  getSignedInUserId,
  toSupabaseError,
} from './supabaseRepository.utils'

type HabitRow = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  notes: string | null
  priority: Habit['priority']
  starts_on: string
  ends_on: string | null
  sort_order: number
  tracking_type: Habit['trackingType']
  schedule_config: Habit['scheduleRule']
  goal_config: Habit['goalConfig']
  minimum_config: {
    enabledCompletionLevels?: Habit['enabledCompletionLevels']
    defaultCompletionLevel?: Habit['defaultCompletionLevel']
    resetMode?: Habit['resetMode']
  } | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

type HabitLogRow = {
  id: string
  user_id: string
  habit_id: string
  log_date: string
  logged_at: string
  status: HabitLog['status']
  completion_level: HabitLog['completionLevel']
  repetitions: number | null
  duration_minutes: number | null
  quantity: number | null
  quantity_unit_label: string | null
  note: string | null
  created_at: string
  updated_at: string
}

const mapHabit = (row: HabitRow): Habit => {
  const enabledCompletionLevels = row.minimum_config?.enabledCompletionLevels ?? []

  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    notes: row.notes,
    priority: row.priority,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    order: row.sort_order,
    trackingType: row.tracking_type,
    scheduleRule: row.schedule_config,
    goalConfig: row.goal_config,
    usesCompletionLevels: enabledCompletionLevels.length > 0,
    enabledCompletionLevels,
    defaultCompletionLevel: row.minimum_config?.defaultCompletionLevel ?? null,
    resetMode: row.minimum_config?.resetMode ?? 'soft',
    lifecycleStatus: row.archived_at ? 'archived' : 'active',
    inactivityPeriods: row.archived_at
      ? [{ reason: 'archived', startsOn: row.archived_at.slice(0, 10), resumesOn: null }]
      : [],
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const mapHabitLog = (row: HabitLogRow): HabitLog => ({
  id: row.id,
  userId: row.user_id,
  habitId: row.habit_id,
  loggedForDate: row.log_date,
  loggedAt: row.logged_at,
  status: row.status,
  completionLevel: row.completion_level,
  repetitions: row.repetitions,
  durationMinutes: row.duration_minutes,
  quantity: row.quantity,
  quantityUnitLabel: row.quantity_unit_label,
  notes: row.note,
  archivedAt: null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toHabitInsert = (input: Parameters<HabitsRepository['create']>[0], userId: string) => ({
  user_id: userId,
  category_id: input.categoryId ?? null,
  title: input.title,
  description: input.description ?? null,
  notes: input.notes ?? null,
  priority: input.priority,
  starts_on: input.startsOn,
  ends_on: input.endsOn ?? null,
  sort_order: input.order,
  tracking_type: input.trackingType,
  schedule_config: input.scheduleRule,
  goal_config: input.goalConfig,
  minimum_config: {
    defaultCompletionLevel: input.defaultCompletionLevel ?? null,
    enabledCompletionLevels: input.enabledCompletionLevels,
    resetMode: input.resetMode,
  },
})

const toHabitPatch = (input: Parameters<HabitsRepository['update']>[0]) => ({
  ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
  ...(input.priority !== undefined ? { priority: input.priority } : {}),
  ...(input.startsOn !== undefined ? { starts_on: input.startsOn } : {}),
  ...(input.endsOn !== undefined ? { ends_on: input.endsOn } : {}),
  ...(input.order !== undefined ? { sort_order: input.order } : {}),
  ...(input.trackingType !== undefined ? { tracking_type: input.trackingType } : {}),
  ...(input.scheduleRule !== undefined ? { schedule_config: input.scheduleRule } : {}),
  ...(input.goalConfig !== undefined ? { goal_config: input.goalConfig } : {}),
  ...(input.enabledCompletionLevels !== undefined ||
  input.defaultCompletionLevel !== undefined ||
  input.resetMode !== undefined
    ? {
        minimum_config: {
          defaultCompletionLevel: input.defaultCompletionLevel ?? null,
          enabledCompletionLevels: input.enabledCompletionLevels ?? [],
          resetMode: input.resetMode ?? 'soft',
        },
      }
    : {}),
})

const valueColumnsByUnit: Record<HabitAmountUnit, 'repetitions' | 'duration_minutes' | 'quantity'> =
  {
    minutes: 'duration_minutes',
    quantity: 'quantity',
    repetitions: 'repetitions',
  }

const execute = <T>(operation: () => Promise<ReturnType<typeof ok<T>> | ReturnType<typeof err>>) =>
  executeSupabaseOperation(operation, 'Supabase habit operation failed.')

export const supabaseHabitsRepository: HabitsRepository = {
  async listForUser() {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('habits')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .order('sort_order', { ascending: true })

      if (error) return err(toSupabaseError('Could not load habits.', error))
      return ok((data as HabitRow[]).map(mapHabit))
    })
  },

  async listForToday({ date }) {
    const habits = await this.listForUser({ userId: '' })
    if (!habits.ok) return habits

    return ok(
      habits.data.filter(
        (habit) =>
          habit.lifecycleStatus === 'active' &&
          (habit.scheduleRule.kind === 'flexiblePeriod' || isHabitScheduledOnDate(habit, date)),
      ),
    )
  },

  async listLogsForDate({ date }) {
    return this.listLogsForRange({ userId: '', from: date, to: date })
  },

  async listLogsForRange({ habitId, from, to }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      let query = getSupabaseClient()
        .from('habit_logs')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .gte('log_date', from)
        .lte('log_date', to)
        .order('log_date', { ascending: true })

      if (habitId) {
        query = query.eq('habit_id', habitId)
      }

      const { data, error } = await query
      if (error) return err(toSupabaseError('Could not load habit logs.', error))
      return ok((data as HabitLogRow[]).map(mapHabitLog))
    })
  },

  async create(input) {
    return execute(async () => {
      if (!input.categoryId) {
        return err(createAppError('validation', 'Habits require a category.'))
      }

      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('habits')
        .insert(toHabitInsert(input, signedInUserId.data))
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not create habit.', error))
      return ok(mapHabit(data as HabitRow))
    })
  },

  async update(input) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('habits')
        .update(toHabitPatch(input))
        .eq('id', input.id)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not update habit.', error))
      if (!data) return err(createNotFoundError('Habit', input.id))
      return ok(mapHabit(data as HabitRow))
    })
  },

  async archive({ habitId }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', habitId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not archive habit.', error))
      if (!data) return err(createNotFoundError('Habit', habitId))
      return ok(mapHabit(data as HabitRow))
    })
  },

  async delete({ habitId }) {
    return execute(async () => {
      const { error } = await getSupabaseClient().from('habits').delete().eq('id', habitId)
      if (error) return err(toSupabaseError('Could not delete habit.', error))
      return ok(null)
    })
  },

  async restore({ habitId }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('habits')
        .update({ archived_at: null })
        .eq('id', habitId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not restore habit.', error))
      if (!data) return err(createNotFoundError('Habit', habitId))
      return ok(mapHabit(data as HabitRow))
    })
  },

  async upsertLog(input) {
    return execute(async () => {
      if (input.value !== null && input.value !== undefined && input.value < 0) {
        return err(createAppError('validation', 'Habit log values cannot be negative.'))
      }

      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const valueColumn = input.unit ? valueColumnsByUnit[input.unit] : null
      const valuePatch =
        valueColumn && input.status === 'completed' ? { [valueColumn]: input.value } : {}
      const { data, error } = await getSupabaseClient()
        .from('habit_logs')
        .upsert(
          {
            user_id: signedInUserId.data,
            habit_id: input.habitId,
            log_date: input.logDate,
            status: input.status,
            completion_level: input.status === 'completed' ? (input.completionLevel ?? null) : null,
            repetitions: null,
            duration_minutes: null,
            quantity: null,
            quantity_unit_label:
              input.status === 'completed' && input.unit === 'quantity' ? input.unit : null,
            note: input.note ?? null,
            ...valuePatch,
          },
          { onConflict: 'user_id,habit_id,log_date' },
        )
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not save habit log.', error))
      return ok(mapHabitLog(data as HabitLogRow))
    })
  },

  async removeLog({ habitId, logDate }) {
    return execute(async () => {
      const { error } = await getSupabaseClient()
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('log_date', logDate)

      if (error) return err(toSupabaseError('Could not remove habit log.', error))
      return ok(null)
    })
  },

  async hardResetLogs({ habitId, confirmed }) {
    return execute(async () => {
      if (!confirmed) {
        throw new Error('Hard reset requires explicit confirmation.')
      }

      const { error } = await getSupabaseClient()
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
      if (error) return err(toSupabaseError('Could not reset habit logs.', error))
      return ok(null)
    })
  },

  async reorder({ orderedHabitIds }) {
    return execute(async () => {
      const supabase = getSupabaseClient()

      for (const [sortOrder, habitId] of orderedHabitIds.entries()) {
        const { error } = await supabase
          .from('habits')
          .update({ sort_order: sortOrder })
          .eq('id', habitId)

        if (error) return err(toSupabaseError('Could not reorder habits.', error))
      }

      return this.listForUser({ userId: '' })
    })
  },
}
