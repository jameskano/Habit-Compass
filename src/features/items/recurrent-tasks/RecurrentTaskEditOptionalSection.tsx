import type { UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import { CategoryCreateButton } from '@/features/categories/CategoryCreateButton'
import { itemPriorities } from '@/shared/types'
import { Checkbox } from '@/shared/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { GuardedEndDateField, ReadOnlyStartDateField } from '../components/ItemDateFields'
import {
  NO_RECURRENT_TASK_CATEGORY_VALUE,
  RECURRENT_TASK_EDIT_INPUT_CLASS,
} from './recurrentTaskEdit.constants'
import type { RecurrentTaskEditValues } from './recurrentTaskEdit.schema'

type RecurrentTaskEditOptionalSectionProps = {
  form: UseFormReturn<RecurrentTaskEditValues>
  categoryOptions: readonly Category[]
  selectedCategoryId: string | null
  selectedPriority: RecurrentTaskEditValues['priority']
  selectedStartsOn: string
  selectedEndsOn: string
  onCategoryChange: (value: string) => void
  onCreateCategory: () => void
  onEndDateChange: (value: string) => void
  onPriorityChange: (value: string) => void
}

export const RecurrentTaskEditOptionalSection = ({
  form,
  categoryOptions,
  selectedCategoryId,
  selectedPriority,
  selectedStartsOn,
  selectedEndsOn,
  onCategoryChange,
  onCreateCategory,
  onEndDateChange,
  onPriorityChange,
}: RecurrentTaskEditOptionalSectionProps) => {
  const intl = useIntl()

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {intl.formatMessage({ id: 'page.items.recurrent.edit.optional' })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="block text-sm font-medium">
          <span>{intl.formatMessage({ id: 'page.items.recurrent.edit.category' })}</span>
          <Select
            value={selectedCategoryId || NO_RECURRENT_TASK_CATEGORY_VALUE}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.category' })}
              className={RECURRENT_TASK_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RECURRENT_TASK_CATEGORY_VALUE}>
                {intl.formatMessage({ id: 'page.items.recurrent.category.none' })}
              </SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CategoryCreateButton onClick={onCreateCategory} />
        </div>
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}
          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}
              className={cn(
                RECURRENT_TASK_EDIT_INPUT_CLASS,
                priorityVisualClasses[selectedPriority],
              )}
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
        <Textarea
          {...form.register('description')}
          rows={3}
          className={RECURRENT_TASK_EDIT_INPUT_CLASS}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReadOnlyStartDateField
          labelId="page.items.recurrent.edit.startsOn"
          value={selectedStartsOn}
        />
        <GuardedEndDateField
          labelId="page.items.recurrent.edit.endsOn"
          value={selectedEndsOn}
          onValueChange={onEndDateChange}
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
        <Textarea
          {...form.register('notes')}
          rows={3}
          className={RECURRENT_TASK_EDIT_INPUT_CLASS}
        />
      </label>
    </section>
  )
}
