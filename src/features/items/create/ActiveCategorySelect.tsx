import { useIntl } from 'react-intl'

import { CategoryCreateButton } from '@/features/categories/CategoryCreateButton'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { CREATE_ITEM_INPUT_CLASS } from './createItem.constants'

type ActiveCategorySelectProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  onCreateCategory?: () => void
}

export const ActiveCategorySelect = ({
  value,
  onChange,
  required = false,
  onCreateCategory,
}: ActiveCategorySelectProps) => {
  const intl = useIntl()
  const categories = useCategoriesQuery().data ?? []

  return (
    <div>
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.details.category' })}
        <Select
          value={value || '__none__'}
          onValueChange={(categoryId) => onChange(categoryId === '__none__' ? '' : categoryId)}
        >
          <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!required ? (
              <SelectItem value="__none__">
                {intl.formatMessage({ id: 'page.items.create.details.noCategory' })}
              </SelectItem>
            ) : null}
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {onCreateCategory ? <CategoryCreateButton onClick={onCreateCategory} /> : null}
    </div>
  )
}
