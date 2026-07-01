import { Check, X } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { SheetClose, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/shared/utils/cn'

import type { PreferenceOption } from './settings.types'

type PreferenceSheetContentProps<Value extends string | number> = {
  titleId: string
  descriptionId?: string
  options: PreferenceOption<Value>[]
  value: Value
  onSelect: (value: Value) => void
}

export const PreferenceSheetContent = <Value extends string | number>({
  descriptionId,
  onSelect,
  options,
  titleId,
  value,
}: PreferenceSheetContentProps<Value>) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <SheetTitle className="text-lg font-semibold">
          <FormattedMessage id={titleId} />
        </SheetTitle>
        {descriptionId ? (
          <SheetDescription className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </SheetDescription>
        ) : null}
      </div>
      <SheetClose className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X aria-hidden size={18} />
        <span className="sr-only">
          <FormattedMessage id="action.close" />
        </span>
      </SheetClose>
    </div>
    <div className="space-y-2">
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors',
              selected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/70 bg-card text-foreground hover:bg-muted',
            )}
          >
            <FormattedMessage id={option.labelId} />
            {selected ? <Check aria-hidden className="text-primary" size={18} /> : null}
          </button>
        )
      })}
    </div>
  </div>
)
