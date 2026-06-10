import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { TodayFilterState } from '@/domain/today'
import type { HabitPriority } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

import {
  ALL_CATEGORIES_VALUE,
  ALL_PRIORITIES_VALUE,
  TODAY_PRIORITIES,
  TODAY_TYPE_FILTERS,
} from './today.constants'

type TodayFiltersProps = {
  filters: TodayFilterState
  activeCategories: Category[]
  onFiltersChange: (update: (current: TodayFilterState) => TodayFilterState) => void
}

export const TodayFilters = ({ filters, activeCategories, onFiltersChange }: TodayFiltersProps) => {
  const intl = useIntl()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  const closeSearch = () => {
    onFiltersChange((current) => ({ ...current, searchText: '' }))
    setSearchOpen(false)
  }

  return (
    <section
      className="space-y-3 rounded-[1.35rem] border border-border/70 bg-card/65 p-3"
      aria-label={intl.formatMessage({ id: 'page.today.filters.aria' })}
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TODAY_TYPE_FILTERS.map((filter) => (
          <Button
            key={filter.type}
            type="button"
            variant="ghost"
            className={cn(
              'h-9 shrink-0 rounded-full border border-border/70 px-3 text-sm text-muted-foreground',
              filters.type === filter.type &&
                'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            )}
            aria-pressed={filters.type === filter.type}
            onClick={() => onFiltersChange((current) => ({ ...current, type: filter.type }))}
          >
            {intl.formatMessage({ id: filter.labelId })}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={filters.categoryId || ALL_CATEGORIES_VALUE}
          onValueChange={(value) =>
            onFiltersChange((current) => ({
              ...current,
              categoryId: value === ALL_CATEGORIES_VALUE ? '' : value,
            }))
          }
        >
          <SelectTrigger
            aria-label={intl.formatMessage({ id: 'page.today.filter.category' })}
            className="rounded-xl border-border/75"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>
              {intl.formatMessage({ id: 'page.today.filter.allCategories' })}
            </SelectItem>
            {activeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.priority || ALL_PRIORITIES_VALUE}
          onValueChange={(value) =>
            onFiltersChange((current) => ({
              ...current,
              priority: value === ALL_PRIORITIES_VALUE ? '' : (value as HabitPriority),
            }))
          }
        >
          <SelectTrigger
            aria-label={intl.formatMessage({ id: 'page.today.filter.priority' })}
            className="rounded-xl border-border/75"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PRIORITIES_VALUE}>
              {intl.formatMessage({ id: 'page.today.filter.allPriorities' })}
            </SelectItem>
            {TODAY_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {intl.formatMessage({ id: `page.items.priority.${priority}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          'transition-[width] duration-200 ease-out motion-reduce:transition-none',
          searchOpen ? 'w-full' : 'w-10',
        )}
      >
        {searchOpen ? (
          <div className="relative flex h-10 items-center rounded-full border border-border/70 bg-background">
            <Search
              aria-hidden="true"
              size={16}
              className="absolute left-3 text-muted-foreground"
            />
            <Input
              ref={searchInputRef}
              value={filters.searchText}
              onChange={(event) =>
                onFiltersChange((current) => ({ ...current, searchText: event.target.value }))
              }
              aria-label={intl.formatMessage({ id: 'page.today.filter.search' })}
              placeholder={intl.formatMessage({ id: 'page.today.filter.searchPlaceholder' })}
              className="h-full min-w-0 flex-1 rounded-full border-0 bg-transparent py-2 pl-9 pr-9 shadow-none"
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-1.5 h-7 min-h-7 w-7 rounded-full p-0 text-muted-foreground"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={closeSearch}
            >
              <X aria-hidden="true" size={15} />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-border/70 p-0 text-muted-foreground"
            aria-label={intl.formatMessage({ id: 'page.today.action.search' })}
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden="true" size={18} />
          </Button>
        )}
      </div>
    </section>
  )
}
