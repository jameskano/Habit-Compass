import {
  reactivateTask,
  shouldAutoArchiveCompletedTask,
  type Task,
  type TasksRepository,
} from '@/domain/tasks'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import {
  executeSupabaseOperation,
  getSignedInUserId,
  toSupabaseError,
} from './supabaseRepository.utils'

type TaskRow = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  notes: string | null
  due_date: string | null
  status: Task['completionStatus']
  priority: Task['priority']
  carry_forward: boolean
  sort_order: number
  completed_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

const mapTask = (row: TaskRow): Task => ({
  id: row.id,
  userId: row.user_id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description,
  notes: row.notes,
  dueDate: row.due_date,
  completionStatus: row.status,
  priority: row.priority,
  carryForward: row.carry_forward,
  order: row.sort_order,
  completedAt: row.completed_at,
  lifecycleStatus: row.archived_at ? 'archived' : 'active',
  archivedAt: row.archived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toTaskInsert = (input: Parameters<TasksRepository['create']>[0], userId: string) => ({
  user_id: userId,
  category_id: input.categoryId ?? null,
  title: input.title,
  description: input.description ?? null,
  notes: input.notes ?? null,
  due_date: input.dueDate ?? null,
  status: input.completionStatus,
  priority: input.priority,
  carry_forward: input.carryForward,
  sort_order: input.order,
  completed_at: input.completedAt ?? null,
})

const toTaskPatch = (input: Parameters<TasksRepository['update']>[0]) => ({
  ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
  ...(input.dueDate !== undefined ? { due_date: input.dueDate } : {}),
  ...(input.completionStatus !== undefined ? { status: input.completionStatus } : {}),
  ...(input.priority !== undefined ? { priority: input.priority } : {}),
  ...(input.carryForward !== undefined ? { carry_forward: input.carryForward } : {}),
  ...(input.order !== undefined ? { sort_order: input.order } : {}),
  ...(input.completedAt !== undefined ? { completed_at: input.completedAt } : {}),
})

const execute = <T>(operation: () => Promise<Result<T>>) =>
  executeSupabaseOperation(operation, 'Supabase task operation failed.')

export const supabaseTasksRepository: TasksRepository = {
  async listForUser() {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .order('sort_order', { ascending: true })

      if (error) return err(toSupabaseError('Could not load tasks.', error))
      return ok((data as TaskRow[]).map(mapTask))
    })
  },

  async listForToday({ date }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .select('*')
        .eq('user_id', signedInUserId.data)
        .is('archived_at', null)
        .or(`due_date.eq.${date},and(due_date.lt.${date},carry_forward.eq.true,status.eq.pending)`)
        .order('sort_order', { ascending: true })

      if (error) return err(toSupabaseError('Could not load tasks.', error))
      return ok((data as TaskRow[]).map(mapTask))
    })
  },

  async create(input) {
    return execute(async () => {
      if (!input.dueDate) {
        return err(createAppError('validation', 'Tasks require a date.'))
      }

      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .insert(toTaskInsert(input, signedInUserId.data))
        .select('*')
        .single()

      if (error) return err(toSupabaseError('Could not create task.', error))
      return ok(mapTask(data as TaskRow))
    })
  },

  async update(input) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .update(toTaskPatch(input))
        .eq('id', input.id)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not update task.', error))
      if (!data) return err(createNotFoundError('Task', input.id))
      return ok(mapTask(data as TaskRow))
    })
  },

  async setCompletionStatus({ taskId, status, today }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .update({
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          status,
        })
        .eq('id', taskId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not update task completion.', error))
      if (!data) return err(createNotFoundError('Task', taskId))
      const task = mapTask(data as TaskRow)
      if (status !== 'completed' || !shouldAutoArchiveCompletedTask(task, today)) {
        return ok(task)
      }

      const archivedAt = new Date().toISOString()
      const archived = await getSupabaseClient()
        .from('tasks')
        .update({ archived_at: archivedAt, updated_at: archivedAt })
        .eq('id', taskId)
        .select('*')
        .maybeSingle()

      if (archived.error) {
        return err(toSupabaseError('Could not archive completed past-due task.', archived.error))
      }
      if (!archived.data) return err(createNotFoundError('Task', taskId))
      return ok(mapTask(archived.data as TaskRow))
    })
  },

  async archiveCompletedPastDue({ today }) {
    return execute(async () => {
      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) return signedInUserId

      const archivedAt = new Date().toISOString()
      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .update({ archived_at: archivedAt, updated_at: archivedAt })
        .eq('user_id', signedInUserId.data)
        .is('archived_at', null)
        .eq('status', 'completed')
        .lt('due_date', today)
        .select('*')

      if (error) return err(toSupabaseError('Could not archive completed past-due tasks.', error))
      return ok((data as TaskRow[]).map(mapTask))
    })
  },

  async archive({ taskId }) {
    return execute(async () => {
      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', taskId)
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not archive task.', error))
      if (!data) return err(createNotFoundError('Task', taskId))
      return ok(mapTask(data as TaskRow))
    })
  },

  async delete({ taskId }) {
    return execute(async () => {
      const { error } = await getSupabaseClient().from('tasks').delete().eq('id', taskId)
      if (error) return err(toSupabaseError('Could not delete task.', error))
      return ok(null)
    })
  },

  async restore({ taskId }) {
    return execute(async () => {
      const current = await getSupabaseClient()
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle()

      if (current.error) return err(toSupabaseError('Could not load task.', current.error))
      if (!current.data) return err(createNotFoundError('Task', taskId))

      const reactivatedTask = reactivateTask(
        mapTask(current.data as TaskRow),
        new Date().toISOString(),
      )

      if (!reactivatedTask) {
        return err(
          createAppError('validation', 'Only archived incomplete tasks can be reactivated.'),
        )
      }

      const { data, error } = await getSupabaseClient()
        .from('tasks')
        .update({
          archived_at: null,
          completed_at: null,
          status: 'pending',
          updated_at: reactivatedTask.updatedAt,
        })
        .eq('id', taskId)
        .not('archived_at', 'is', null)
        .neq('status', 'completed')
        .select('*')
        .maybeSingle()

      if (error) return err(toSupabaseError('Could not restore task.', error))
      if (!data) {
        return err(
          createAppError('validation', 'Only archived incomplete tasks can be reactivated.'),
        )
      }
      return ok(mapTask(data as TaskRow))
    })
  },

  async reorder({ orderedTaskIds }) {
    return execute(async () => {
      const supabase = getSupabaseClient()

      for (const [sortOrder, taskId] of orderedTaskIds.entries()) {
        const { error } = await supabase
          .from('tasks')
          .update({ sort_order: sortOrder })
          .eq('id', taskId)
        if (error) return err(toSupabaseError('Could not reorder tasks.', error))
      }

      return this.listForUser({ userId: '' })
    })
  },
}
