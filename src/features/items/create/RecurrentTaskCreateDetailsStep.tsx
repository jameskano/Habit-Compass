import { useIntl } from 'react-intl'

import type { CreateRecurrentTaskInput } from '@/domain/recurrent-tasks'
import { itemPriorities } from '@/shared/types'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

import { DatePickerField } from '../components/ItemDateFields'
import { ActiveCategorySelect } from './ActiveCategorySelect'
import { CREATE_ITEM_INPUT_CLASS } from './createItem.constants'

type RecurrentTaskCreateDetailsStepProps = {
  title: string
  categoryId: string
  priority: CreateRecurrentTaskInput['priority']
  description: string
  startsOn: string
  endsOn: string
  onTitleChange: (value: string) => void
  onCategoryIdChange: (value: string) => void
  onPriorityChange: (value: CreateRecurrentTaskInput['priority']) => void
  onDescriptionChange: (value: string) => void
  onStartsOnChange: (value: string) => void
  onEndsOnChange: (value: string) => void
  onCreateCategory: () => void
}

export const RecurrentTaskCreateDetailsStep = ({
  categoryId,
  description,
  endsOn,
  onCategoryIdChange,
  onCreateCategory,
  onDescriptionChange,
  onEndsOnChange,
  onPriorityChange,
  onStartsOnChange,
  onTitleChange,
  priority,
  startsOn,
  title,
}: RecurrentTaskCreateDetailsStepProps) => {
  const intl = useIntl()

  return (
    <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.details.name' })}
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className={CREATE_ITEM_INPUT_CLASS}
        />
      </label>
      <ActiveCategorySelect
        value={categoryId}
        onChange={onCategoryIdChange}
        onCreateCategory={onCreateCategory}
      />
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.details.priority' })}
        <Select
          value={priority}
          onValueChange={(value) => onPriorityChange(value as CreateRecurrentTaskInput['priority'])}
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
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className={CREATE_ITEM_INPUT_CLASS}
        />
      </label>
      <DatePickerField
        labelId="page.items.create.details.startsOn"
        value={startsOn}
        onValueChange={onStartsOnChange}
      />
      <DatePickerField
        labelId="page.items.create.details.endsOn"
        value={endsOn}
        onValueChange={onEndsOnChange}
        allowClear
      />
    </section>
  )
}
