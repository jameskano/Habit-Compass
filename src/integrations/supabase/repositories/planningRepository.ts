import type { PlanningRepository, WeeklyBigRock, WeeklyPlan } from '@/domain/planning'
import { createNotFoundError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import {
  executeSupabaseOperation,
  getSignedInUserId,
  toSupabaseError,
} from './supabaseRepository.utils'

type WeeklyPlanRow = {
  id: string
  user_id: string
  week_start: string
  focus_text: string | null
  review_overall_feeling: WeeklyPlan['reviewOverallFeeling']
  review_went_well: string | null
  review_got_in_way: string | null
  review_adjust_next_week: string | null
  review_reflections: string | null
  archived_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type WeeklyBigRockRow = {
  id: string
  user_id: string
  weekly_plan_id: string
  habit_id: string
  sort_order: number
  archived_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

const mapWeeklyPlan = (row: WeeklyPlanRow): WeeklyPlan => ({
  id: row.id,
  userId: row.user_id,
  weekStartDate: row.week_start,
  focusText: row.focus_text,
  reviewOverallFeeling: row.review_overall_feeling,
  reviewWentWell: row.review_went_well,
  reviewGotInWay: row.review_got_in_way,
  reviewAdjustNextWeek: row.review_adjust_next_week,
  reviewReflections: row.review_reflections,
  archivedAt: row.archived_at,
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapWeeklyBigRock = (row: WeeklyBigRockRow): WeeklyBigRock => ({
  id: row.id,
  userId: row.user_id,
  weeklyPlanId: row.weekly_plan_id,
  habitId: row.habit_id,
  sortOrder: row.sort_order,
  archivedAt: row.archived_at,
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toWeeklyPlanInsert = (
  input: Parameters<PlanningRepository['create']>[0],
  userId: string,
) => ({
  user_id: userId,
  week_start: input.weekStartDate,
  focus_text: input.focusText ?? null,
  review_overall_feeling: input.reviewOverallFeeling ?? null,
  review_went_well: input.reviewWentWell ?? null,
  review_got_in_way: input.reviewGotInWay ?? null,
  review_adjust_next_week: input.reviewAdjustNextWeek ?? null,
  review_reflections: input.reviewReflections ?? null,
})

const toWeeklyPlanPatch = (input: Parameters<PlanningRepository['update']>[0]) => ({
  ...(input.weekStartDate !== undefined ? { week_start: input.weekStartDate } : {}),
  ...(input.focusText !== undefined ? { focus_text: input.focusText } : {}),
  ...(input.reviewOverallFeeling !== undefined
    ? { review_overall_feeling: input.reviewOverallFeeling }
    : {}),
  ...(input.reviewWentWell !== undefined ? { review_went_well: input.reviewWentWell } : {}),
  ...(input.reviewGotInWay !== undefined ? { review_got_in_way: input.reviewGotInWay } : {}),
  ...(input.reviewAdjustNextWeek !== undefined
    ? { review_adjust_next_week: input.reviewAdjustNextWeek }
    : {}),
  ...(input.reviewReflections !== undefined ? { review_reflections: input.reviewReflections } : {}),
  ...(input.archivedAt !== undefined ? { archived_at: input.archivedAt } : {}),
  ...(input.deletedAt !== undefined ? { deleted_at: input.deletedAt } : {}),
})

const execute = <T>(operation: () => Promise<Result<T>>) =>
  executeSupabaseOperation(operation, 'Supabase planning operation failed.')

export const supabasePlanningRepository: PlanningRepository = {
  async listForUser() {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_plans')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .order('week_start', { ascending: false })

      if (error) return err(toSupabaseError('Could not load weekly plans.', error))
      return ok((data as WeeklyPlanRow[]).map(mapWeeklyPlan))
    })
  },
  async getForWeek({ weekStartDate }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_plans')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .eq('week_start', weekStartDate)
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not load weekly plan.', error))
      return ok(data ? mapWeeklyPlan(data as WeeklyPlanRow) : null)
    })
  },
  async create(input) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_plans')
        .insert(toWeeklyPlanInsert(input, signedInUserId.data))
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not create weekly plan.', error))
      return ok(mapWeeklyPlan(data as WeeklyPlanRow))
    })
  },
  async update(input) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_plans')
        .update(toWeeklyPlanPatch(input))
        .eq('user_id', signedInUserId.data)
        .eq('id', input.id)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not update weekly plan.', error))
      if (!data) return err(createNotFoundError('Weekly plan', input.id))
      return ok(mapWeeklyPlan(data as WeeklyPlanRow))
    })
  },
  async listBigRocks({ weeklyPlanId }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_big_rocks')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .eq('weekly_plan_id', weeklyPlanId)
        .order('sort_order', { ascending: true })

      if (error) return err(toSupabaseError('Could not load weekly Big Rocks.', error))
      return ok((data as WeeklyBigRockRow[]).map(mapWeeklyBigRock))
    })
  },
  async addBigRock({ weeklyPlanId, habitId }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const existingBigRocks = await this.listBigRocks({
        userId: signedInUserId.data,
        weeklyPlanId,
      })
      if (!existingBigRocks.ok) return existingBigRocks

      const { data, error } = await getSupabaseClient()
        .from('weekly_big_rocks')
        .insert({
          user_id: signedInUserId.data,
          weekly_plan_id: weeklyPlanId,
          habit_id: habitId,
          sort_order: existingBigRocks.data.length,
        })
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not add weekly Big Rock.', error))
      return ok(mapWeeklyBigRock(data as WeeklyBigRockRow))
    })
  },
  async removeBigRock({ weeklyPlanId, habitId }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('weekly_big_rocks')
        .delete()
        .eq('user_id', signedInUserId.data)
        .eq('weekly_plan_id', weeklyPlanId)
        .eq('habit_id', habitId)
        .select('id')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not remove weekly Big Rock.', error))
      if (!data) return err(createNotFoundError('Weekly Big Rock', habitId))
      return ok(null)
    })
  },
  async archive({ weeklyPlanId }) {
    return this.update({
      id: weeklyPlanId,
      archivedAt: new Date().toISOString(),
    })
  },
  async softDelete({ weeklyPlanId }) {
    return this.update({
      id: weeklyPlanId,
      deletedAt: new Date().toISOString(),
    })
  },
  async restore({ weeklyPlanId }) {
    return this.update({
      id: weeklyPlanId,
      archivedAt: null,
      deletedAt: null,
    })
  },
}
