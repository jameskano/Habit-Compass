import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import { useNavigate } from '@tanstack/react-router'

import {
  CATEGORY_DEFAULT_NAME_MESSAGE_IDS,
  isProtectedCategory,
  type Category,
} from '@/domain/categories'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'
import { getCategoryVisualClasses } from '@/styles/itemVisualTokens'

import { CategoryFormSheet } from './CategoryFormSheet'
import { CategoryIcon } from './CategoryIcon'

type SheetState = { mode: 'create'; category: null } | { mode: 'edit'; category: Category } | null

const categoryDisplayName = (intl: ReturnType<typeof useIntl>, category: Category) => {
  if (!category.defaultKey) {
    return category.name
  }

  return intl.formatMessage({ id: CATEGORY_DEFAULT_NAME_MESSAGE_IDS[category.defaultKey] })
}

const CategoryCard = ({
  category,
  onOpen,
}: {
  category: Category
  onOpen: (category: Category) => void
}) => {
  const intl = useIntl()
  const name = categoryDisplayName(intl, category)

  return (
    <button
      type="button"
      className="min-h-24 rounded-lg border border-border/70 bg-card/85 p-3 text-left shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={intl.formatMessage({ id: 'category.card.open' }, { category: name })}
      onClick={() => onOpen(category)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-2xl border',
            getCategoryVisualClasses(category.colorToken),
          )}
        >
          <CategoryIcon iconName={category.iconName} />
        </span>
        <span className="line-clamp-2 pt-1 text-sm font-semibold leading-5">{name}</span>
      </div>
    </button>
  )
}

export const CategoriesPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const categoriesQuery = useCategoriesQuery()
  const [sheetState, setSheetState] = useState<SheetState>(null)
  useShellTitle('category.page.title')

  if (categoriesQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categories = categoriesQuery.data ?? []
  const userCategories = categories.filter((category) => !isProtectedCategory(category))
  const defaultCategories = categories.filter(isProtectedCategory)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="size-10 rounded-full border border-border/70 p-0"
          aria-label={intl.formatMessage({ id: 'action.back' })}
          onClick={() => navigate({ to: '/settings' })}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h2 className="flex-1 text-xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'category.page.title' })}
        </h2>
        <Button
          variant="ghost"
          className="size-10 rounded-full border border-border/70 p-0"
          aria-label={intl.formatMessage({ id: 'category.page.add' })}
          onClick={() => setSheetState({ mode: 'create', category: null })}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="user-categories-heading">
        <h3 id="user-categories-heading" className="text-sm font-semibold text-muted-foreground">
          {intl.formatMessage({ id: 'category.page.userSection' })}
        </h3>
        {userCategories.length === 0 ? (
          <Card className="rounded-lg border-dashed p-4 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'category.page.userEmpty' })}
          </Card>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] gap-3">
            {userCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onOpen={(selectedCategory) =>
                  setSheetState({ mode: 'edit', category: selectedCategory })
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="default-categories-heading">
        <h3 id="default-categories-heading" className="text-sm font-semibold text-muted-foreground">
          {intl.formatMessage({ id: 'category.page.defaultSection' })}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] gap-3">
          {defaultCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onOpen={(selectedCategory) =>
                setSheetState({ mode: 'edit', category: selectedCategory })
              }
            />
          ))}
        </div>
      </section>

      <CategoryFormSheet
        open={Boolean(sheetState)}
        mode={sheetState?.mode ?? 'create'}
        category={sheetState?.category ?? null}
        categories={categories}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSheetState(null)
          }
        }}
      />
    </section>
  )
}
