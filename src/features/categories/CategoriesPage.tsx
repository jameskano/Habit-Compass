import { ArrowLeft, Info, Plus, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useShellActions } from '@/shared/ui/useShellActions'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'

import { CategoryCard } from './CategoryCard'
import { CategoryFormSheet } from './CategoryFormSheet'

type SheetState = { mode: 'create'; category: null } | { mode: 'edit'; category: Category } | null

type DisplayCategory = {
  category: Category
  displayName: string
}

const categoryDisplayName = (intl: ReturnType<typeof useIntl>, category: Category) => {
  if (!category.defaultKey) {
    return category.name
  }

  return intl.formatMessage({ id: CATEGORY_DEFAULT_NAME_MESSAGE_IDS[category.defaultKey] })
}

export const CategoriesPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const categoriesQuery = useCategoriesQuery()
  const [sheetState, setSheetState] = useState<SheetState>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  useShellTitle('category.page.title')

  const openCreateSheet = useCallback(() => {
    setSheetState({ mode: 'create', category: null })
  }, [])

  const handleBack = useCallback(() => {
    navigate({ to: '/settings' })
  }, [navigate])

  const shellLeading = useMemo(
    () => (
      <Button
        variant="ghost"
        className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
        aria-label={intl.formatMessage({ id: 'action.back' })}
        onClick={handleBack}
      >
        <ArrowLeft aria-hidden="true" size={20} />
      </Button>
    ),
    [handleBack, intl],
  )

  const shellActions = useMemo(
    () => (
      <>
        <Popover open={infoOpen} onOpenChange={setInfoOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground',
                infoOpen && 'border-primary bg-primary/15 text-primary',
              )}
              aria-label={intl.formatMessage({ id: 'category.page.info.open' })}
            >
              <Info aria-hidden="true" size={20} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 text-sm leading-relaxed">
            <p>{intl.formatMessage({ id: 'category.page.info.body' })}</p>
            <p className="mt-3 font-medium text-foreground">
              {intl.formatMessage({ id: 'category.page.info.examples' })}
            </p>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
          aria-label={intl.formatMessage({ id: 'category.page.add' })}
          onClick={openCreateSheet}
        >
          <Plus aria-hidden="true" size={20} />
        </Button>
      </>
    ),
    [infoOpen, intl, openCreateSheet],
  )

  useShellLeading(shellLeading)
  useShellActions(shellActions)

  if (categoriesQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categories = categoriesQuery.data ?? []
  const normalizedSearch = searchText.trim().toLocaleLowerCase()
  const hasSearch = normalizedSearch.length > 0
  const displayCategories: DisplayCategory[] = categories
    .map((category) => ({
      category,
      displayName: categoryDisplayName(intl, category),
    }))
    .filter(({ displayName }) => displayName.toLocaleLowerCase().includes(normalizedSearch))
  const userCategories = displayCategories.filter(({ category }) => !isProtectedCategory(category))
  const defaultCategories = displayCategories.filter(({ category }) =>
    isProtectedCategory(category),
  )
  const shouldShowUserCategories = !hasSearch || userCategories.length > 0
  const shouldShowDefaultCategories = !hasSearch || defaultCategories.length > 0
  const hasSearchResults = userCategories.length > 0 || defaultCategories.length > 0

  return (
    <section className="flex flex-col gap-6">
      <div className="relative">
        <label htmlFor="category-search" className="sr-only">
          {intl.formatMessage({ id: 'category.page.search' })}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="category-search"
          type="search"
          className="pl-9"
          value={searchText}
          placeholder={intl.formatMessage({ id: 'category.page.searchPlaceholder' })}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {shouldShowUserCategories ? (
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
              {userCategories.map(({ category, displayName }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  displayName={displayName}
                  onOpen={(selectedCategory) =>
                    setSheetState({ mode: 'edit', category: selectedCategory })
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {shouldShowDefaultCategories ? (
        <section className="flex flex-col gap-3" aria-labelledby="default-categories-heading">
          <h3
            id="default-categories-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            {intl.formatMessage({ id: 'category.page.defaultSection' })}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] gap-3">
            {defaultCategories.map(({ category, displayName }) => (
              <CategoryCard
                key={category.id}
                category={category}
                displayName={displayName}
                onOpen={(selectedCategory) =>
                  setSheetState({ mode: 'edit', category: selectedCategory })
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasSearch && !hasSearchResults ? (
        <Card className="rounded-lg border-dashed p-4 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'category.page.searchEmpty' })}
        </Card>
      ) : null}

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
