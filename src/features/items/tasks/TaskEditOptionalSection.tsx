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

import { NO_TASK_CATEGORY_VALUE, TASK_EDIT_INPUT_CLASS } from './taskEdit.constants'
import type { TaskEditValues } from './taskEdit.schema'

type TaskEditOptionalSectionProps = {
  form: UseFormReturn<TaskEditValues>
  categoryOptions: readonly Category[]
  selectedCategoryId: string | null
  selectedPriority: TaskEditValues['priority']
  onCategoryChange: (value: string) => void
  onCreateCategory: () => void
  onPriorityChange: (value: string) => void
}

export const TaskEditOptionalSection = ({
  form,
  categoryOptions,
  selectedCategoryId,
  selectedPriority,
  onCategoryChange,
  onCreateCategory,
  onPriorityChange,
}: TaskEditOptionalSectionProps) => {
  const intl = useIntl()

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {intl.formatMessage({ id: 'page.items.task.edit.optional' })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="block text-sm font-medium">
          <span>{intl.formatMessage({ id: 'page.items.task.edit.category' })}</span>
          <Select
            value={selectedCategoryId || NO_TASK_CATEGORY_VALUE}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.task.edit.category' })}
              className={TASK_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TASK_CATEGORY_VALUE}>
                {intl.formatMessage({ id: 'page.items.task.category.none' })}
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
          {intl.formatMessage({ id: 'page.items.task.edit.priority' })}
          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.task.edit.priority' })}
              className={cn(TASK_EDIT_INPUT_CLASS, priorityVisualClasses[selectedPriority])}
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
        {intl.formatMessage({ id: 'page.items.task.edit.description' })}
        <Textarea {...form.register('description')} rows={3} className={TASK_EDIT_INPUT_CLASS} />
      </label>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
        <span>{intl.formatMessage({ id: 'page.items.task.edit.carryForward' })}</span>
        <Checkbox {...form.register('carryForward')} />
      </label>
      <label className="block text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.task.edit.notes' })}
        <Textarea {...form.register('notes')} rows={4} className={TASK_EDIT_INPUT_CLASS} />
      </label>
    </section>
  )
}
