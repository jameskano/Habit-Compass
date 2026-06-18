import type { UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { Input } from '@/shared/ui/input'

import { DatePickerField } from '../components/ItemDateFields'
import { TASK_EDIT_INPUT_CLASS } from './taskEdit.constants'
import type { TaskEditValues } from './taskEdit.schema'

type TaskEditEssentialsSectionProps = {
  form: UseFormReturn<TaskEditValues>
  selectedDueDate: string
  onDueDateChange: (value: string) => void
}

export const TaskEditEssentialsSection = ({
  form,
  selectedDueDate,
  onDueDateChange,
}: TaskEditEssentialsSectionProps) => {
  const intl = useIntl()

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {intl.formatMessage({ id: 'page.items.task.edit.essentials' })}
      </p>
      <label className="block text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.task.edit.name' })}
        <Input {...form.register('title')} className={TASK_EDIT_INPUT_CLASS} />
        {form.formState.errors.title ? (
          <span className="mt-1 block text-xs text-amber-700">
            {intl.formatMessage({ id: 'page.items.task.edit.error.name' })}
          </span>
        ) : null}
      </label>
      <DatePickerField
        labelId="page.items.task.edit.dueDate"
        value={selectedDueDate}
        onValueChange={onDueDateChange}
        error={
          form.formState.errors.dueDate
            ? intl.formatMessage({ id: 'page.items.task.edit.error.date' })
            : undefined
        }
      />
    </section>
  )
}
