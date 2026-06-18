import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'

import { CATEGORY_COLOR_PALETTE } from '@/domain/categories'
import { cn } from '@/shared/utils/cn'

import type { CategoryColorPaletteProps } from './categoryForm.types'

export const CategoryColorPalette = ({
  open,
  colorToken,
  onColorTokenChange,
  selectedColorRef,
}: CategoryColorPaletteProps) => {
  const intl = useIntl()
  const internalSelectedColorRef = useRef<HTMLButtonElement | null>(null)
  const activeSelectedColorRef = selectedColorRef ?? internalSelectedColorRef

  useEffect(() => {
    if (open) {
      activeSelectedColorRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }, [activeSelectedColorRef, colorToken, open])

  return (
    <div>
      <p className="text-sm font-medium">{intl.formatMessage({ id: 'category.form.color' })}</p>
      <div
        className="mt-2 flex snap-x gap-3 overflow-x-auto pb-2"
        aria-label={intl.formatMessage({ id: 'category.form.colorPalette' })}
      >
        {CATEGORY_COLOR_PALETTE.map((color) => {
          const selected = color.token === colorToken
          const label = intl.formatMessage({ id: color.labelMessageId })

          return (
            <button
              key={color.token}
              ref={selected ? activeSelectedColorRef : undefined}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              className={cn(
                'grid size-11 shrink-0 snap-start place-items-center rounded-full border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'border-foreground',
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onColorTokenChange(color.token)}
            >
              {selected ? (
                <Check aria-hidden="true" className="size-5 text-white drop-shadow" />
              ) : null}
              <span className="sr-only">
                {selected
                  ? intl.formatMessage({ id: 'category.form.colorSelected' }, { color: label })
                  : label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
