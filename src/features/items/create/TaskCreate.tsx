import { useIntl } from 'react-intl'

import type { CreateTaskInput } from '@/domain/tasks'
import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { itemPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

import { DatePickerField } from '../components/ItemDateFields'
import { ActiveCategorySelect } from './ActiveCategorySelect'
import { CREATE_ITEM_INPUT_CLASS } from './createItem.constants'
import type { CreateDialogProps } from './createItem.types'
import { DialogFrame } from './DialogFrame'
import { ErrorText } from './ErrorText'
import { useTaskCreateForm } from './useTaskCreateForm'

export const TaskCreate = ({ onClose }: CreateDialogProps) => {
  const intl = useIntl()
  const taskCreate = useTaskCreateForm(onClose)

  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.task.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.name' })}
          <Input
            value={taskCreate.title}
            onChange={(event) => taskCreate.setTitle(event.target.value)}
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
        <DatePickerField
          labelId="page.items.create.task.date"
          value={taskCreate.dueDate}
          onValueChange={taskCreate.setDueDate}
        />
        <ActiveCategorySelect
          value={taskCreate.categoryId}
          onChange={taskCreate.setCategoryId}
          onCreateCategory={() => taskCreate.setCreatingCategory(true)}
        />
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.priority' })}
          <Select
            value={taskCreate.priority}
            onValueChange={(value) => taskCreate.setPriority(value as CreateTaskInput['priority'])}
          >
            <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemPriorities.map((value) => (
                <SelectItem key={value} value={value}>
                  {intl.formatMessage({ id: `page.items.priority.${value}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.description' })}
          <Textarea
            value={taskCreate.description}
            onChange={(event) => taskCreate.setDescription(event.target.value)}
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
          <span>{intl.formatMessage({ id: 'page.items.create.task.carryForward' })}</span>
          <Checkbox
            checked={taskCreate.carryForward}
            onChange={(event) => taskCreate.setCarryForward(event.target.checked)}
          />
        </label>
        {taskCreate.error ? <ErrorText>{taskCreate.error}</ErrorText> : null}
        <Button onClick={taskCreate.submit} disabled={taskCreate.isPending}>
          {intl.formatMessage({ id: 'page.items.create.save' })}
        </Button>
      </div>
      <CategoryFormSheet
        open={taskCreate.creatingCategory}
        mode="create"
        categories={taskCreate.categories}
        onCreated={taskCreate.selectCreatedCategory}
        onOpenChange={(nextOpen) => taskCreate.setCreatingCategory(nextOpen)}
      />
    </DialogFrame>
  )
}
