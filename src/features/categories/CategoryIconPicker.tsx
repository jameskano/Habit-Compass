import { ArrowLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils/cn'

import { CategoryIcon } from './CategoryIcon'
import { searchCategoryIconDefinitions } from './categoryIconRegistry'
import type { CategoryIconPickerProps } from './categoryForm.types'

export const CategoryIconPicker = ({
  open,
  selectedIcon,
  onBack,
  onSelect,
}: CategoryIconPickerProps) => {
  const intl = useIntl()
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const icons = useMemo(
    () => searchCategoryIconDefinitions(query, intl.locale),
    [intl.locale, query],
  )

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onBack()}>
      <DialogContent
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border/70 bg-card/70 px-4 py-4">
          <Button
            variant="ghost"
            className="size-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.back' })}
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {intl.formatMessage({ id: 'category.iconPicker.title' })}
          </DialogTitle>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="relative">
            <label htmlFor="icon-search" className="sr-only">
              {intl.formatMessage({ id: 'category.iconPicker.search' })}
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="icon-search"
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder={intl.formatMessage({ id: 'category.iconPicker.searchPlaceholder' })}
            />
          </div>
          <div
            className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-3"
            aria-label={intl.formatMessage({ id: 'category.iconPicker.grid' })}
          >
            {icons.map((definition) => {
              const selected = definition.key === selectedIcon
              const label = intl.formatMessage({ id: definition.labelMessageId })

              return (
                <button
                  key={definition.key}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border/70 bg-card/80 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'border-primary bg-primary/10 text-primary',
                  )}
                  onClick={() => onSelect(definition.key)}
                >
                  <CategoryIcon iconName={definition.key} />
                  <span className="sr-only">
                    {selected
                      ? intl.formatMessage({ id: 'category.iconPicker.selected' }, { label })
                      : label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
