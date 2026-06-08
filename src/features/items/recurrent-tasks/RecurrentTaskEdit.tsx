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
import { useAppToast } from '@/shared/hooks/useAppToast'
import { itemPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { GuardedEndDateField, ReadOnlyStartDateField } from '../components/ItemDateFields'
import {
  isValidDaysOfMonthInput,
  isValidDaysOfYearInput,
  parseDaysOfMonthInput,
  parseDaysOfYearInput,
} from '../components/scheduleInputParsers'
import { RecurrentTaskConfirmationDialog } from './RecurrentTaskConfirmationDialog'

type RecurrentTaskEditProps = {
  task: RecurrentTask
  categories: Category[]
  today: string
  onClose: () => void
  onArchived: (task: RecurrentTask) => void
  onDeleted: (task: RecurrentTask) => void
}

const RecurrentEditValuesSchema = z
  .object({
    title: z.string().trim().min(1),
    recurrenceKind: z.enum(recurrenceKinds),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    daysOfMonth: z.string(),
    daysOfYear: z.string(),
    intervalDays: z.number().int().positive(),
    intervalWeeks: z.number().int().positive(),
    intervalMonths: z.number().int().positive(),
    dayOfMonth: z.number().int().min(1).max(31),
    weekday: z.number().int().min(0).max(6),
    customDescription: z.string(),
    categoryId: z.string(),
    priority: z.enum(itemPriorities),
    carryForward: z.boolean(),
    description: z.string(),
    notes: z.string(),
    startsOn: z.string().min(1),
    endsOn: z.string(),
  })
  .superRefine((values, context) => {
    if (values.endsOn && values.endsOn < values.startsOn) {
      context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
    }
    if (
      (values.recurrenceKind === 'specificDaysOfWeek' || values.recurrenceKind === 'everyXWeeks') &&
      values.daysOfWeek.length === 0
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
    }
    if (
      values.recurrenceKind === 'specificDaysOfMonth' &&
      !isValidDaysOfMonthInput(values.daysOfMonth)
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfMonth'], message: 'chooseDay' })
    }
    if (
      values.recurrenceKind === 'specificDaysOfYear' &&
      !isValidDaysOfYearInput(values.daysOfYear)
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfYear'], message: 'chooseDay' })
    }
    if (values.recurrenceKind === 'customFutureRule' && !values.customDescription.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['customDescription'],
        message: 'descriptionRequired',
      })
    }
  })

type RecurrentEditValues = z.infer<typeof RecurrentEditValuesSchema>
const noCategoryValue = '__none__'

function valuesForTask(task: RecurrentTask): RecurrentEditValues {
  const rule = task.recurrenceRule
  return {
    title: task.title,
    recurrenceKind: rule.kind,
    daysOfWeek:
      rule.kind === 'specificDaysOfWeek' || rule.kind === 'everyXWeeks' ? [...rule.daysOfWeek] : [],
    daysOfMonth: rule.kind === 'specificDaysOfMonth' ? rule.daysOfMonth.join(', ') : '1',
    daysOfYear:
      rule.kind === 'specificDaysOfYear'
        ? rule.daysOfYear.map(({ month, day }) => `${month}-${day}`).join(', ')
        : '1-1',
    intervalDays: rule.kind === 'everyXDays' ? rule.intervalDays : 2,
    intervalWeeks: rule.kind === 'everyXWeeks' ? rule.intervalWeeks : 1,
    intervalMonths: rule.kind === 'everyXMonths' ? rule.intervalMonths : 1,
    dayOfMonth: rule.kind === 'everyXMonths' ? rule.dayOfMonth : 1,
    weekday: rule.kind === 'firstWeekdayOfMonth' ? rule.weekday : 1,
    customDescription: rule.kind === 'customFutureRule' ? rule.description : '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    carryForward: task.carryForward,
    description: task.description ?? '',
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
    case 'specificDaysOfMonth':
      return {
        kind: 'specificDaysOfMonth',
        daysOfMonth: parseDaysOfMonthInput(values.daysOfMonth),
      }
    case 'specificDaysOfYear':
      return {
        kind: 'specificDaysOfYear',
        daysOfYear: parseDaysOfYearInput(values.daysOfYear),
      }
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
  today,
  onClose,
  onArchived,
  onDeleted,
}: RecurrentTaskEditProps) {
  const intl = useIntl()
  const appToast = useAppToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const updateMutation = useUpdateRecurrentTaskMutation()
  const archiveMutation = useArchiveRecurrentTaskMutation()
  const deleteMutation = useDeleteRecurrentTaskMutation()
  const pending = updateMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
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
      description: values.description.trim() || null,
      notes: values.notes.trim() || null,
      startsOn: values.startsOn,
      endsOn: values.endsOn || null,
    }

    updateMutation.mutate(input, {
      onSuccess: () => {
        if (values.endsOn && values.endsOn < today) {
          archiveMutation.mutate(task.id, { onSuccess: () => onArchived(task) })
          return
        }
        appToast.success({ id: 'page.items.recurrent.edit.saved' })
      },
    })
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
        aria-label={intl.formatMessage(
          { id: 'page.items.recurrent.edit.title' },
          { task: task.title },
        )}
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 z-50 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,52rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="sr-only">
              {intl.formatMessage({ id: 'page.items.recurrent.edit.title' }, { task: task.title })}
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
                <Input {...form.register('title')} className={inputClass} />
                {form.formState.errors.title ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.error.name' })}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.frequency' })}
                <Select
                  value={recurrenceKind}
                  onValueChange={(value) =>
                    form.setValue(
                      'recurrenceKind',
                      value as RecurrentEditValues['recurrenceKind'],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  <SelectTrigger
                    aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.frequency' })}
                    className={inputClass}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceKinds.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {intl.formatMessage({ id: `page.items.recurrent.edit.schedule.${kind}` })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {recurrenceKind === 'specificDaysOfWeek' || recurrenceKind === 'everyXWeeks' ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.days' })}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {dayOfWeekValues.map((day) => (
                      <Button
                        variant="ghost"
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
                      </Button>
                    ))}
                  </div>
                  {form.formState.errors.daysOfWeek ? (
                    <span className="text-xs text-amber-700">
                      {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
                    </span>
                  ) : null}
                </fieldset>
              ) : null}
              {recurrenceKind === 'specificDaysOfMonth' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.frequency.monthDays' })}
                  <Input {...form.register('daysOfMonth')} className={inputClass} />
                  {form.formState.errors.daysOfMonth ? (
                    <span className="mt-1 block text-xs text-amber-700">
                      {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
                    </span>
                  ) : null}
                </label>
              ) : null}
              {recurrenceKind === 'specificDaysOfYear' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.frequency.yearDays' })}
                  <Input {...form.register('daysOfYear')} className={inputClass} />
                  {form.formState.errors.daysOfYear ? (
                    <span className="mt-1 block text-xs text-amber-700">
                      {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
                    </span>
                  ) : null}
                </label>
              ) : null}
              {recurrenceKind === 'everyXDays' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalDays' })}
                  <Input
                    type="number"
                    min={1}
                    {...form.register('intervalDays', { valueAsNumber: true })}
                    className={inputClass}
                  />
                </label>
              ) : null}
              {recurrenceKind === 'everyXWeeks' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalWeeks' })}
                  <Input
                    type="number"
                    min={1}
                    {...form.register('intervalWeeks', { valueAsNumber: true })}
                    className={inputClass}
                  />
                </label>
              ) : null}
              {recurrenceKind === 'everyXMonths' ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalMonths' })}
                    <Input
                      type="number"
                      min={1}
                      {...form.register('intervalMonths', { valueAsNumber: true })}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.recurrent.edit.dayOfMonth' })}
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      {...form.register('dayOfMonth', { valueAsNumber: true })}
                      className={inputClass}
                    />
                  </label>
                </div>
              ) : null}
              {recurrenceKind === 'firstWeekdayOfMonth' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.weekday' })}
                  <Select
                    value={String(form.watch('weekday'))}
                    onValueChange={(value) =>
                      form.setValue('weekday', Number(value) as RecurrentEditValues['weekday'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.weekday' })}
                      className={inputClass}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOfWeekValues.map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
              {recurrenceKind === 'customFutureRule' ? (
                <label className="block text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.customDescription' })}
                  <Input {...form.register('customDescription')} className={inputClass} />
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
                  <Select
                    value={form.watch('categoryId') || noCategoryValue}
                    onValueChange={(value) =>
                      form.setValue('categoryId', value === noCategoryValue ? '' : value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.category' })}
                      className={inputClass}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={noCategoryValue}>
                        {intl.formatMessage({ id: 'page.items.recurrent.category.none' })}
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
                  {intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}
                  <Select
                    value={selectedPriority}
                    onValueChange={(value) =>
                      form.setValue('priority', value as RecurrentEditValues['priority'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}
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
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.description' })}
                <Textarea {...form.register('description')} rows={3} className={inputClass} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadOnlyStartDateField
                  labelId="page.items.recurrent.edit.startsOn"
                  value={form.watch('startsOn')}
                  registration={form.register('startsOn')}
                />
                <GuardedEndDateField
                  labelId="page.items.recurrent.edit.endsOn"
                  registration={form.register('endsOn')}
                  error={
                    form.formState.errors.endsOn
                      ? intl.formatMessage({ id: 'page.items.recurrent.edit.error.endDate' })
                      : undefined
                  }
                  warningTitleId="page.items.recurrent.edit.endDateWarning.title"
                  warningDescriptionId="page.items.recurrent.edit.endDateWarning.description"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
                <span>{intl.formatMessage({ id: 'page.items.recurrent.edit.carryForward' })}</span>
                <Checkbox {...form.register('carryForward')} />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.recurrent.edit.notes' })}
                <Textarea {...form.register('notes')} rows={3} className={inputClass} />
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
              onClick={() => archiveMutation.mutate(task.id, { onSuccess: () => onArchived(task) })}
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
          onConfirm={() => deleteMutation.mutate(task.id, { onSuccess: () => onDeleted(task) })}
        />
      </DialogContent>
    </Dialog>
  )
}
