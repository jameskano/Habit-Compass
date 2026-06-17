import { Archive, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

type ItemsFilterRowProps = {
  categories: Category[]
  categoryId: string
  categoryLabelId: string
  allCategoriesLabelId: string
  searchLabelId: string
  searchPlaceholderId: string
  tabLabelId: string
  searchText: string
  showingArchived: boolean
  onCategoryChange: (categoryId: string) => void
  onSearchChange: (searchText: string) => void
  onToggleArchive: () => void
}

const allCategoriesValue = '__all__'

export const ItemsFilterRow = ({
  categories,
  categoryId,
  categoryLabelId,
  allCategoriesLabelId,
  searchLabelId,
  searchPlaceholderId,
  tabLabelId,
  searchText,
  showingArchived,
  onCategoryChange,
  onSearchChange,
  onToggleArchive,
}: ItemsFilterRowProps) => {
  const intl = useIntl()
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabLabel = intl.formatMessage({ id: tabLabelId })

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus()
    }
  }, [searchOpen])

  const closeSearch = () => {
    onSearchChange('')
    setSearchOpen(false)
  }

  return (
    <section
      className="flex mb-3 mt-4 items-center gap-2 rounded-[1.35rem] border border-border/70 bg-card/65 p-2.5"
      aria-label={intl.formatMessage({ id: 'page.items.filters.aria' })}
    >
      <Select
        value={categoryId || allCategoriesValue}
        onValueChange={(value) => onCategoryChange(value === allCategoriesValue ? '' : value)}
      >
        <SelectTrigger
          aria-label={intl.formatMessage({ id: categoryLabelId })}
          className="min-w-0 flex-1 rounded-xl border-border/75 sm:max-w-52"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allCategoriesValue}>
            {intl.formatMessage({ id: allCategoriesLabelId })}
          </SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        className={cn(
          'shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none',
          searchOpen ? 'w-[min(13rem,48vw)]' : 'w-10',
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
              ref={inputRef}
              value={searchText}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label={intl.formatMessage({ id: searchLabelId })}
              placeholder={intl.formatMessage({ id: searchPlaceholderId })}
              className="h-full min-w-0 flex-1 rounded-full border-0 bg-transparent py-2 pl-9 pr-9 shadow-none"
            />
            <Button
              variant="ghost"
              type="button"
              onClick={closeSearch}
              aria-label={intl.formatMessage({ id: 'action.close' })}
              className="absolute right-1.5 h-7 min-h-7 w-7 rounded-full p-0 text-muted-foreground"
            >
              <X aria-hidden="true" size={15} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="h-10 w-10 rounded-full border border-border/70 p-0 text-muted-foreground"
            aria-label={intl.formatMessage({ id: 'page.items.action.search' }, { tab: tabLabel })}
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden="true" size={18} />
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        className={cn(
          'h-10 w-10 shrink-0 rounded-full border border-border/70 p-0 text-muted-foreground',
          showingArchived &&
            'border-primary bg-primary/15 text-primary hover:border-primary hover:bg-primary/20 hover:text-primary',
        )}
        aria-label={intl.formatMessage(
          {
            id: showingArchived ? 'page.items.action.showActive' : 'page.items.action.showArchived',
          },
          { tab: tabLabel },
        )}
        aria-pressed={showingArchived}
        onClick={onToggleArchive}
      >
        <Archive aria-hidden="true" size={18} />
      </Button>
    </section>
  )
}
