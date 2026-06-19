import { memo } from 'react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import { Textarea } from '@/shared/ui/textarea'

import { GuardedEndDateField, ReadOnlyStartDateField } from '../components/ItemDateFields'
import { HABIT_EDIT_INPUT_CLASS } from './habitEdit.constants'
import type { HabitEditValues } from './habitEdit.schema'
import { HabitEditCategoryPriorityFields } from './HabitEditCategoryPriorityFields'
import { HabitEditTrackingFields } from './HabitEditTrackingFields'

type HabitEditDetailsSectionProps = {
  form: UseFormReturn<HabitEditValues>
  categoryOptions: readonly Category[]
  selectedCategoryId: string | null
  onCategoryChange: (value: string) => void
  onCreateCategory: () => void
  onEndDateChange: (value: string) => void
  onPeriodChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onTrackingTypeChange: (value: string) => void
}

export const HabitEditDetailsSection = memo(
  ({
    form,
    categoryOptions,
    selectedCategoryId,
    onCategoryChange,
    onCreateCategory,
    onEndDateChange,
    onPeriodChange,
    onPriorityChange,
    onTrackingTypeChange,
  }: HabitEditDetailsSectionProps) => {
    const intl = useIntl()
    const { errors } = useFormState({ control: form.control, name: 'endsOn' })
    const selectedStartsOn = useWatch({ control: form.control, name: 'startsOn' })
    const selectedEndsOn = useWatch({ control: form.control, name: 'endsOn' })

    return (
      <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage({ id: 'page.items.habit.edit.optional' })}
        </p>
        <HabitEditCategoryPriorityFields
          form={form}
          categoryOptions={categoryOptions}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={onCategoryChange}
          onCreateCategory={onCreateCategory}
          onPriorityChange={onPriorityChange}
        />
        <HabitEditTrackingFields
          form={form}
          onPeriodChange={onPeriodChange}
          onTrackingTypeChange={onTrackingTypeChange}
        />
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.habit.edit.description' })}
          <Textarea {...form.register('description')} rows={3} className={HABIT_EDIT_INPUT_CLASS} />
        </label>
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.habit.edit.notes' })}
          <Textarea {...form.register('notes')} rows={3} className={HABIT_EDIT_INPUT_CLASS} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyStartDateField
            labelId="page.items.habit.edit.startsOn"
            value={selectedStartsOn}
          />
          <GuardedEndDateField
            labelId="page.items.habit.edit.endsOn"
            value={selectedEndsOn}
            onValueChange={onEndDateChange}
            error={
              errors.endsOn
                ? intl.formatMessage({ id: 'page.items.habit.edit.error.endDate' })
                : undefined
            }
            warningTitleId="page.items.habit.edit.endDateWarning.title"
            warningDescriptionId="page.items.habit.edit.endDateWarning.description"
          />
        </div>
      </section>
    )
  },
)

HabitEditDetailsSection.displayName = 'HabitEditDetailsSection'
