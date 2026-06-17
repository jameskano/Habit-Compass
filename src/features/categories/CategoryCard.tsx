import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import { cn } from '@/shared/utils/cn'
import { getCategoryVisualClasses } from '@/styles/itemVisualTokens'

import { CategoryIcon } from './CategoryIcon'

type CategoryCardProps = {
  category: Category
  displayName: string
  onOpen: (category: Category) => void
}

export const CategoryCard = ({ category, displayName, onOpen }: CategoryCardProps) => {
  const intl = useIntl()

  return (
    <button
      type="button"
      className="min-h-24 rounded-lg border border-border/70 bg-card/85 p-3 text-left shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={intl.formatMessage({ id: 'category.card.open' }, { category: displayName })}
      onClick={() => onOpen(category)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-2xl border',
            getCategoryVisualClasses(category.colorToken),
          )}
        >
          <CategoryIcon iconName={category.iconName} />
        </span>
        <span className="min-w-0 truncate pt-1 text-sm font-semibold leading-5" title={displayName}>
          {displayName}
        </span>
      </div>
    </button>
  )
}
