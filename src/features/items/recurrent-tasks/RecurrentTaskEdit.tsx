import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { Category } from '@/domain/categories'
import {
  dayOfWeekValues,
  recurrenceKinds,
  type DayOfWeek,
  type RecurrenceRule,
  type RecurrentTask,
  type UpdateRecurrentTaskInput,
} from '@/domain/recurrent-tasks'
import {
  useArchiveRecurrentTaskMutation,
  useDeleteRecurrentTaskMutation,
  useUpdateRecurrentTaskMutation,
} from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { itemPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { RecurrentTaskConfirmationDialog } from './RecurrentTaskConfirmationDialog'

type RecurrentTaskEditProps = {
  task: RecurrentTask
  categories: Category[]
  onClose: () => void
  onArchived: (task: RecurrentTask) => void
  onDeleted: (task: RecurrentTask) => void
}

const RecurrentEditValuesSchema = z
  .object({
    title: z.string().trim().min(1),
    recurrenceKind: z.enum(recurrenceKinds),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    intervalDays: z.number().int().positive(),
    intervalWeeks: z.number().int().positive(),
    intervalMonths: z.number().int().positive(),
    dayOfMonth: z.number().int().min(1).max(31),
    weekday: z.number().int().min(0).max(6),
    customDescription: z.string(),
    categoryId: z.string(),
    priority: z.enum(itemPriorities),
    carryForward: z.boolean(),
    notes: z.string(),
    startsOn: z.string().min(1),
    endsOn: z.string(),
  })
  .superRefine((values, context) => {
    if (values.endsOn && values.endsOn < values.startsOn) {
      context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
    }
    if (
      (values.recurrenceKind === 'specificDaysOfWeek' ||
        values.recurrenceKind === 'everyXWeeks') &&
      values.daysOfWeek.length === 0
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
    }
    if (values.recurrenceKind === 'customFutureRule' && !values.customDescription.trim()) {
      context.addIssue({ code: 'custom', path: ['customDescription'], message: 'descriptionRequired' })
    }
  })

type RecurrentEditValues = z.infer<typeof RecurrentEditValuesSchema>

function valuesForTask(task: RecurrentTask): RecurrentEditValues {
  const rule = task.recurrenceRule
  return {
    title: task.title,
    recurrenceKind: rule.kind,
    daysOfWeek:
      rule.kind === 'specificDaysOfWeek' || rule.kind === 'everyXWeeks'
        ? [...rule.daysOfWeek]
        : [],
    intervalDays: rule.kind === 'everyXDays' ? rule.intervalDays : 2,
    intervalWeeks: rule.kind === 'everyXWeeks' ? rule.intervalWeeks : 1,
    intervalMonths: rule.kind === 'everyXMonths' ? rule.intervalMonths : 1,
    dayOfMonth: rule.kind === 'everyXMonths' ? rule.dayOfMonth : 1,
    weekday: rule.kind === 'firstWeekdayOfMonth' ? rule.weekday : 1,
    customDescription: rule.kind === 'customFutureRule' ? rule.description : '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    carryForward: task.carryForward,
    notes: task.notes ?? '',
    startsOn: task.startsOn,
    endsOn: task.endsOn ?? '',
  }
}

function buildRule(values: RecurrentEditValues): RecurrenceRule {
  switch (values.recurrenceKind) {
    case 'daily':
      return { kind: 'daily' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: values.daysOfWeek as DayOfWeek[] }
    case 'everyXDays':
      return { kind: 'everyXDays', intervalDays: values.intervalDays }
    case 'everyXWeeks':
      return {
        kind: 'everyXWeeks',
        intervalWeeks: values.intervalWeeks,
        daysOfWeek: values.daysOfWeek as DayOfWeek[],
      }
    case 'everyXMonths':
      return {
        kind: 'everyXMonths',
        intervalMonths: values.intervalMonths,
        dayOfMonth: values.dayOfMonth,
      }
    case 'firstWeekdayOfMonth':
      return { kind: 'firstWeekdayOfMonth', weekday: values.weekday as DayOfWeek }
    case 'customFutureRule':
      return { kind: 'customFutureRule', description: values.customDescription.trim() }
  }
}

export function RecurrentTaskEdit({
  task,
  categories,
  onClose,
  onArchived,
  onDeleted,
}: RecurrentTaskEditProps) {
  const intl = useIntl()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saved, setSaved] = useState(false)
  const updateMutation = useUpdateRecurrentTaskMutation()
  const archiveMutation = useArchiveRecurrentTaskMutation()
  const deleteMutation = useDeleteRecurrentTaskMutation()
  const pending =
    updateMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
  const form = useForm<RecurrentEditValues>({
    resolver: zodResolver(RecurrentEditValuesSchema),
    defaultValues: valuesForTask(task),
  })
  const recurrenceKind = form.watch('recurrenceKind')
  const selectedDays = form.watch('daysOfWeek')
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

  const toggleDay = (day: DayOfWeek) => {
    form.setValue(
      'daysOfWeek',
      selectedDays.includes(day)
        ? selectedDays.filter((entry) => entry !== day)
        : [...selectedDays, day].sort(),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const submit = form.handleSubmit((values) => {
    const input: UpdateRecurrentTaskInput = {
      id: task.id,
      title: values.title.trim(),
      recurrenceRule: buildRule(values),
      categoryId: values.categoryId || null,
      priority: values.priority,
      carryForward: values.carryForward,
      notes: values.notes.trim() || null,
      startsOn: values.startsOn,
      endsOn: values.endsOn || null,
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
        aria-label={intl.formatMessage(
          { id: 'page.items.recurrent.edit.title' },
          { task: task.title },
        )}
        className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl md:max-h-[min(92vh,52rem)] md:max-w-xl md:rounded-[1.7rem] md:border md:border-border/75"
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
              {intl.formatMessage({ id: 'page.items.recurrent.edit.saved' })}
            </p>
          ) : null}
          <form
            aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.form' })}
            onSubmit={submit}
            className="space-y-5"
          >
            <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.essentials' })}
              </p>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.name' })}
                <input {...form.register('title')} className={inputClass} />
                {form.formState.errors.title ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.error.name' })}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.frequency' })}
                <select {...form.register('recurrenceKind')} className={inputClass}>
                  {recurrenceKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {intl.formatMessage({ id: `page.items.recurrent.edit.schedule.${kind}` })}
                    </option>
                  ))}
                </select>
              </label>
              {recurrenceKind === 'specificDaysOfWeek' || recurrenceKind === 'everyXWeeks' ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.days' })}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {dayOfWeekValues.map((day) => (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selectedDays.includes(day)}
                        onClick={() => toggleDay(day)}
                        className={cn(
                          'rounded-full border border-border/75 px-3 py-2 text-xs font-medium',
                          selectedDays.includes(day) &&
                            'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {intl.formatMessage({ id: `page.items.weekday.short.${day}` })}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.daysOfWeek ? (
                    <span className="text-xs text-amber-700">
                      {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
                    </span>
                  ) : null}
                </fieldset>
              ) : null}
              {recurrenceKind === 'everyXDays' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalDays' })}
                  <input type="number" min={1} {...form.register('intervalDays', { valueAsNumber: true })} className={inputClass} />
                </label>
              ) : null}
              {recurrenceKind === 'everyXWeeks' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalWeeks' })}
                  <input type="number" min={1} {...form.register('intervalWeeks', { valueAsNumber: true })} className={inputClass} />
                </label>
              ) : null}
              {recurrenceKind === 'everyXMonths' ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalMonths' })}
                    <input type="number" min={1} {...form.register('intervalMonths', { valueAsNumber: true })} className={inputClass} />
                  </label>
                  <label className="block text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.dayOfMonth' })}
                    <input type="number" min={1} max={31} {...form.register('dayOfMonth', { valueAsNumber: true })} className={inputClass} />
                  </label>
                </div>
              ) : null}
              {recurrenceKind === 'firstWeekdayOfMonth' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.weekday' })}
                  <select {...form.register('weekday', { valueAsNumber: true })} className={inputClass}>
                    {dayOfWeekValues.map((day) => (
                      <option key={day} value={day}>
                        {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {recurrenceKind === 'customFutureRule' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.customDescription' })}
                  <input {...form.register('customDescription')} className={inputClass} />
                </label>
              ) : null}
            </section>
            <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.optional' })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.category' })}
                  <select {...form.register('categoryId')} className={inputClass}>
                    <option value="">
                      {intl.formatMessage({ id: 'page.items.recurrent.category.none' })}
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
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}
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
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.startsOn' })}
                  <input type="date" {...form.register('startsOn')} className={inputClass} />
                </label>
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.endsOn' })}
                  <input type="date" {...form.register('endsOn')} className={inputClass} />
                  {form.formState.errors.endsOn ? (
                    <span className="mt-1 block text-xs text-amber-700">
                      {intl.formatMessage({ id: 'page.items.recurrent.edit.error.endDate' })}
                    </span>
                  ) : null}
                </label>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
                <span>{intl.formatMessage({ id: 'page.items.recurrent.edit.carryForward' })}</span>
                <input
                  type="checkbox"
                  {...form.register('carryForward')}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.notes' })}
                <textarea {...form.register('notes')} rows={3} className={inputClass} />
              </label>
            </section>
            <Button type="submit" className="w-full rounded-xl" disabled={pending}>
              {intl.formatMessage({ id: 'page.items.recurrent.edit.save' })}
            </Button>
          </form>
          <section className="mt-6 space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
            <h3 className="text-sm font-semibold">
              {intl.formatMessage({ id: 'page.items.recurrent.edit.dangerTitle' })}
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
              {intl.formatMessage({ id: 'page.items.recurrent.action.archive' })}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 aria-hidden="true" size={17} />
              {intl.formatMessage({ id: 'page.items.recurrent.action.delete' })}
            </Button>
          </section>
        </div>
        <RecurrentTaskConfirmationDialog
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
