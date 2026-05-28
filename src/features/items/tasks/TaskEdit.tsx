import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { Category } from '@/domain/categories'
import type { Task, UpdateTaskInput } from '@/domain/tasks'
import {
  useArchiveTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/useTaskMutations'
import { itemPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { TaskConfirmationDialog } from './TaskConfirmationDialog'

type TaskEditProps = {
  task: Task
  categories: Category[]
  onClose: () => void
  onArchived: (task: Task) => void
  onDeleted: (task: Task) => void
}

const TaskEditValuesSchema = z.object({
  title: z.string().trim().min(1),
  dueDate: z.string(),
  categoryId: z.string(),
  priority: z.enum(itemPriorities),
  carryForward: z.boolean(),
  notes: z.string(),
})

type TaskEditValues = z.infer<typeof TaskEditValuesSchema>

function valuesForTask(task: Task): TaskEditValues {
  return {
    title: task.title,
    dueDate: task.dueDate ?? '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    carryForward: task.carryForward,
    notes: task.notes ?? '',
  }
}

export function TaskEdit({
  task,
  categories,
  onClose,
  onArchived,
  onDeleted,
}: TaskEditProps) {
  const intl = useIntl()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saved, setSaved] = useState(false)
  const updateMutation = useUpdateTaskMutation()
  const archiveMutation = useArchiveTaskMutation()
  const deleteMutation = useDeleteTaskMutation()
  const pending =
    updateMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
  const form = useForm<TaskEditValues>({
    resolver: zodResolver(TaskEditValuesSchema),
    defaultValues: valuesForTask(task),
  })
  const selectedPriority = form.watch('priority')

  useEffect(() => {
    form.reset(valuesForTask(task))
  }, [form, task])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmingDelete) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [confirmingDelete, onClose])

  const submit = form.handleSubmit((values) => {
    const input: UpdateTaskInput = {
      id: task.id,
      title: values.title.trim(),
      dueDate: values.dueDate || null,
      categoryId: values.categoryId || null,
      priority: values.priority,
      carryForward: values.carryForward,
      notes: values.notes.trim() || null,
    }

    updateMutation.mutate(input, { onSuccess: () => setSaved(true) })
  })

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border/75 bg-background px-3 py-2.5 text-sm text-foreground'

  return (
    <div
      className="fixed inset-0 z-40 flex bg-foreground/30 backdrop-blur-sm md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={intl.formatMessage({ id: 'page.items.task.edit.title' }, { task: task.title })}
        className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl md:max-h-[min(92vh,46rem)] md:max-w-xl md:rounded-[1.7rem] md:border md:border-border/75"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-border/70 bg-card/70 px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">{task.title}</h2>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full border border-border/70 p-0"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={onClose}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {saved ? (
            <p role="status" className="mb-4 rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'page.items.task.edit.saved' })}
            </p>
          ) : null}
          <form
            aria-label={intl.formatMessage({ id: 'page.items.task.edit.form' })}
            onSubmit={submit}
            className="space-y-5"
          >
            <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.task.edit.essentials' })}
              </p>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.task.edit.name' })}
                <input {...form.register('title')} className={inputClass} />
                {form.formState.errors.title ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    {intl.formatMessage({ id: 'page.items.task.edit.error.name' })}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.task.edit.dueDate' })}
                <input type="date" {...form.register('dueDate')} className={inputClass} />
              </label>
            </section>
            <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.task.edit.optional' })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.task.edit.category' })}
                  <select {...form.register('categoryId')} className={inputClass}>
                    <option value="">
                      {intl.formatMessage({ id: 'page.items.task.category.none' })}
                    </option>
                    {categories
                      .filter((category) => category.lifecycleStatus === 'active')
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.task.edit.priority' })}
                  <select
                    {...form.register('priority')}
                    className={cn(inputClass, priorityVisualClasses[selectedPriority])}
                  >
                    {itemPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {intl.formatMessage({ id: `page.items.priority.${priority}` })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
                <span>{intl.formatMessage({ id: 'page.items.task.edit.carryForward' })}</span>
                <input
                  type="checkbox"
                  {...form.register('carryForward')}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.task.edit.notes' })}
                <textarea {...form.register('notes')} rows={4} className={inputClass} />
              </label>
            </section>
            <Button type="submit" className="w-full rounded-xl" disabled={pending}>
              {intl.formatMessage({ id: 'page.items.task.edit.save' })}
            </Button>
          </form>

          <section className="mt-6 space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
            <h3 className="text-sm font-semibold">
              {intl.formatMessage({ id: 'page.items.task.edit.dangerTitle' })}
            </h3>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 border border-border/60 bg-card/75"
              disabled={task.lifecycleStatus === 'archived' || pending}
              onClick={() =>
                archiveMutation.mutate(task.id, { onSuccess: () => onArchived(task) })
              }
            >
              <Archive aria-hidden="true" size={17} />
              {intl.formatMessage({ id: 'page.items.task.action.archive' })}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 aria-hidden="true" size={17} />
              {intl.formatMessage({ id: 'page.items.task.action.delete' })}
            </Button>
          </section>
        </div>
        <TaskConfirmationDialog
          task={task}
          open={confirmingDelete}
          pending={pending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() =>
            deleteMutation.mutate(task.id, { onSuccess: () => onDeleted(task) })
          }
        />
      </section>
    </div>
  )
}
