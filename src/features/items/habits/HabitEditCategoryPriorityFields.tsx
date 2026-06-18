import { memo } from 'react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import { CategoryCreateButton } from '@/features/categories/CategoryCreateButton'
import { habitPriorities } from '@/shared/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { HABIT_EDIT_INPUT_CLASS, NO_HABIT_CATEGORY_VALUE } from './habitEdit.constants'
import type { HabitEditValues } from './habitEdit.schema'

type HabitEditCategoryPriorityFieldsProps = {
  form: UseFormReturn<HabitEditValues>
  categoryOptions: readonly Category[]
  selectedCategoryId: string | null
  onCategoryChange: (value: string) => void
  onCreateCategory: () => void
  onPriorityChange: (value: string) => void
}

export const HabitEditCategoryPriorityFields = memo(
  ({
    form,
    categoryOptions,
    selectedCategoryId,
    onCategoryChange,
    onCreateCategory,
    onPriorityChange,
  }: HabitEditCategoryPriorityFieldsProps) => {
    const intl = useIntl()
    const { errors } = useFormState({ control: form.control, name: 'categoryId' })
    const selectedPriority = useWatch({ control: form.control, name: 'priority' })

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="block text-sm font-medium">
          <span>{intl.formatMessage({ id: 'page.items.habit.edit.category' })}</span>
          <Select
            value={selectedCategoryId || NO_HABIT_CATEGORY_VALUE}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.habit.edit.category' })}
              className={HABIT_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_HABIT_CATEGORY_VALUE}>
                {intl.formatMessage({ id: 'page.items.habit.category.none' })}
              </SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId ? (
            <span className="mt-1 block text-xs text-amber-700">
              {intl.formatMessage({ id: 'page.items.habit.edit.error.category' })}
            </span>
          ) : null}
          <CategoryCreateButton onClick={onCreateCategory} />
        </div>
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.habit.edit.priority' })}
          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.habit.edit.priority' })}
              className={cn(HABIT_EDIT_INPUT_CLASS, priorityVisualClasses[selectedPriority])}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {habitPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {intl.formatMessage({ id: `page.items.priority.${priority}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    )
  },
)

HabitEditCategoryPriorityFields.displayName = 'HabitEditCategoryPriorityFields'
