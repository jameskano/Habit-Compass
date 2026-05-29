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
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
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
const noCategoryValue = '__none__'

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

  const inputClass = 'mt-1.5 rounded-xl border-border/75'

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !confirmingDelete) {
          onClose()
        }
      }}
    >
      <DialogContent
        aria-label={intl.formatMessage({ id: 'page.items.task.edit.title' }, { task: task.title })}
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 z-50 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,46rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="sr-only">
              {intl.formatMessage({ id: 'page.items.task.edit.title' }, { task: task.title })}
            </DialogTitle>
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
        </DialogHeader>
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
                <Input {...form.register('title')} className={inputClass} />
                {form.formState.errors.title ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    {intl.formatMessage({ id: 'page.items.task.edit.error.name' })}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.task.edit.dueDate' })}
                <Input type="date" {...form.register('dueDate')} className={inputClass} />
              </label>
            </section>
            <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.task.edit.optional' })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.task.edit.category' })}
                  <Select
                    value={form.watch('categoryId') || noCategoryValue}
                    onValueChange={(value) =>
                      form.setValue(
                        'categoryId',
                        value === noCategoryValue ? '' : value,
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger
                      aria-label={intl.formatMessage({ id: 'page.items.task.edit.category' })}
                      className={inputClass}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={noCategoryValue}>
                        {intl.formatMessage({ id: 'page.items.task.category.none' })}
                      </SelectItem>
                    {categories
                      .filter((category) => category.lifecycleStatus === 'active')
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.task.edit.priority' })}
                  <Select
                    value={selectedPriority}
                    onValueChange={(value) =>
                      form.setValue('priority', value as TaskEditValues['priority'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={intl.formatMessage({ id: 'page.items.task.edit.priority' })}
                      className={cn(inputClass, priorityVisualClasses[selectedPriority])}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {itemPriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {intl.formatMessage({ id: `page.items.priority.${priority}` })}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
                <span>{intl.formatMessage({ id: 'page.items.task.edit.carryForward' })}</span>
                <Checkbox
                  {...form.register('carryForward')}
                />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.task.edit.notes' })}
                <Textarea {...form.register('notes')} rows={4} className={inputClass} />
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
      </DialogContent>
    </Dialog>
  )
}
