import {
  deriveRecurrentOccurrences,
  type RecurrentTask,
  type RecurrentTaskOccurrence,
  type RecurrentTasksRepository,
} from '@/domain/recurrent-tasks'
import { createNotFoundError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import {
  executeSupabaseOperation,
  getSignedInUserId,
  toSupabaseError,
} from './supabaseRepository.utils'

type RecurrentTaskRow = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  notes: string | null
  priority: RecurrentTask['priority']
  starts_on: string
  ends_on: string | null
  carry_forward: boolean
  sort_order: number
  recurrence_config: RecurrentTask['recurrenceRule']
  archived_at: string | null
  created_at: string
  updated_at: string
}

type RecurrentTaskOccurrenceRow = {
  id: string
  user_id: string
  recurrent_task_id: string
  occurrence_date: string
  status: RecurrentTaskOccurrence['status']
  completed_at: string | null
  created_at: string
  updated_at: string
}

const mapRecurrentTask = (row: RecurrentTaskRow): RecurrentTask => ({
  id: row.id,
  userId: row.user_id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description,
  notes: row.notes,
  priority: row.priority,
  startsOn: row.starts_on,
  endsOn: row.ends_on,
  carryForward: row.carry_forward,
  order: row.sort_order,
  recurrenceRule: row.recurrence_config,
  lifecycleStatus: row.archived_at ? 'archived' : 'active',
  archivedAt: row.archived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapOccurrence = (row: RecurrentTaskOccurrenceRow): RecurrentTaskOccurrence => ({
  id: row.id,
  userId: row.user_id,
  recurrentTaskId: row.recurrent_task_id,
  scheduledForDate: row.occurrence_date,
  status: row.status,
  completedAt: row.completed_at,
  archivedAt: null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toTaskInsert = (
  input: Parameters<RecurrentTasksRepository['create']>[0],
  userId: string,
) => ({
  user_id: userId,
  category_id: input.categoryId ?? null,
  title: input.title,
  description: input.description ?? null,
  notes: input.notes ?? null,
  priority: input.priority,
  starts_on: input.startsOn,
  ends_on: input.endsOn ?? null,
  carry_forward: input.carryForward,
  sort_order: input.order,
  recurrence_config: input.recurrenceRule,
})

const toTaskPatch = (input: Parameters<RecurrentTasksRepository['update']>[0]) => ({
  ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
  ...(input.priority !== undefined ? { priority: input.priority } : {}),
  ...(input.startsOn !== undefined ? { starts_on: input.startsOn } : {}),
  ...(input.endsOn !== undefined ? { ends_on: input.endsOn } : {}),
  ...(input.carryForward !== undefined ? { carry_forward: input.carryForward } : {}),
  ...(input.order !== undefined ? { sort_order: input.order } : {}),
  ...(input.recurrenceRule !== undefined ? { recurrence_config: input.recurrenceRule } : {}),
})

const execute = <T>(operation: () => Promise<Result<T>>) =>
  executeSupabaseOperation(operation, 'Supabase recurrent task operation failed.')

export const supabaseRecurrentTasksRepository: RecurrentTasksRepository = {
  async listForUser() {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .order('sort_order', { ascending: true })

      if (error) return err(toSupabaseError('Could not load recurrent tasks.', error))
      return ok((data as RecurrentTaskRow[]).map(mapRecurrentTask))
    })
  },

  async listForToday({ date }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const tasksQuery = getSupabaseClient()
        .from('recurrent_tasks')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .is('archived_at', null)
        .lte('starts_on', date)
        .or(`ends_on.is.null,ends_on.gte.${date}`)
        .order('sort_order', { ascending: true })

      const [tasksResponse, occurrences] = await Promise.all([
        tasksQuery,
        this.listOccurrencesForRange({ userId: '', from: date, to: date }),
      ])

      if (tasksResponse.error) {
        return err(toSupabaseError('Could not load recurrent tasks.', tasksResponse.error))
      }
      if (!occurrences.ok) return occurrences

      const tasks = (tasksResponse.data as RecurrentTaskRow[]).map(mapRecurrentTask)

      return ok(
        tasks
          .flatMap((task) =>
            deriveRecurrentOccurrences({
              task,
              storedOccurrences: occurrences.data.filter(
                (occurrence) => occurrence.recurrentTaskId === task.id,
              ),
              from: date,
              to: date,
              today: date,
            }),
          )
          .map(
            (derived) =>
              derived.storedOccurrence ?? {
                id: `derived-${derived.recurrentTaskId}-${derived.scheduledForDate}`,
                userId: tasks.find((task) => task.id === derived.recurrentTaskId)?.userId ?? '',
                recurrentTaskId: derived.recurrentTaskId,
                scheduledForDate: derived.scheduledForDate,
                status: derived.status,
                completedAt: null,
                archivedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
          ),
      )
    })
  },

  async listOccurrencesForRange({ recurrentTaskId, from, to }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      let query = getSupabaseClient()
        .from('recurrent_task_logs')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .gte('occurrence_date', from)
        .lte('occurrence_date', to)
        .order('occurrence_date', { ascending: true })

      if (recurrentTaskId) {
        query = query.eq('recurrent_task_id', recurrentTaskId)
      }

      const { data, error } = await query
      if (error) return err(toSupabaseError('Could not load recurrent task occurrences.', error))
      return ok((data as RecurrentTaskOccurrenceRow[]).map(mapOccurrence))
    })
  },

  async create(input) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .insert(toTaskInsert(input, signedInUserId.data))
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not create recurrent task.', error))
      return ok(mapRecurrentTask(data as RecurrentTaskRow))
    })
  },

  async update(input) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .update(toTaskPatch(input))
        .eq('id', input.id)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not update recurrent task.', error))
      if (!data) return err(createNotFoundError('Recurrent task', input.id))
      return ok(mapRecurrentTask(data as RecurrentTaskRow))
    })
  },

  async archive({ recurrentTaskId }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', recurrentTaskId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not archive recurrent task.', error))
      if (!data) return err(createNotFoundError('Recurrent task', recurrentTaskId))
      return ok(mapRecurrentTask(data as RecurrentTaskRow))
    })
  },

  async delete({ recurrentTaskId }) {
    return execute(async () => {
      const { error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .delete()
        .eq('id', recurrentTaskId)

      if (error) return err(toSupabaseError('Could not delete recurrent task.', error))
      return ok(null)
    })
  },

  async restore({ recurrentTaskId }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('recurrent_tasks')
        .update({ archived_at: null })
        .eq('id', recurrentTaskId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not restore recurrent task.', error))
      if (!data) return err(createNotFoundError('Recurrent task', recurrentTaskId))
      return ok(mapRecurrentTask(data as RecurrentTaskRow))
    })
  },

  async reorder({ orderedRecurrentTaskIds }) {
    return execute(async () => {
      const supabase = getSupabaseClient()

      for (const [sortOrder, recurrentTaskId] of orderedRecurrentTaskIds.entries()) {
        const { error } = await supabase
          .from('recurrent_tasks')
          .update({ sort_order: sortOrder })
          .eq('id', recurrentTaskId)

        if (error) return err(toSupabaseError('Could not reorder recurrent tasks.', error))
      }

      return this.listForUser({ userId: '' })
    })
  },

  async logCompletion({ recurrentTaskId, occurrenceDate, status, note }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('recurrent_task_logs')
        .upsert(
          {
            user_id: signedInUserId.data,
            recurrent_task_id: recurrentTaskId,
            occurrence_date: occurrenceDate,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            note: note ?? null,
          },
          { onConflict: 'user_id,recurrent_task_id,occurrence_date' },
        )
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not save recurrent task occurrence.', error))
      return ok(mapOccurrence(data as RecurrentTaskOccurrenceRow))
    })
  },
}
