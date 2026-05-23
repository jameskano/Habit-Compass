import { X } from 'lucide-react'
import { type KeyboardEvent as ReactKeyboardEvent, useEffect } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from './button'

type AddItemSheetProps = {
  open: boolean
  onClose: () => void
}

const optionIds = [
  'sheet.add.habit',
  'sheet.add.task',
  'sheet.add.recurrentTask',
  'sheet.add.category',
  'sheet.add.reflection',
] as const

export function AddItemSheet({ open, onClose }: AddItemSheetProps) {
  const intl = useIntl()

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  const handleContainerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-sheet-title"
        className="w-full rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-2xl md:mx-auto md:mb-8 md:max-w-lg md:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleContainerKeyDown}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <FormattedMessage id="sheet.add.eyebrow" />
            </p>
            <h2 id="add-item-sheet-title" className="text-xl font-semibold">
              <FormattedMessage id="sheet.add.title" />
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={intl.formatMessage({ id: 'action.close' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/90 text-foreground hover:bg-muted"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {optionIds.map((optionId) => (
            <Button
              key={optionId}
              variant="secondary"
              className="w-full justify-between rounded-2xl border border-border/60 px-4 py-4 text-left"
              onClick={onClose}
            >
              <span>
                <FormattedMessage id={optionId} />
              </span>
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <FormattedMessage id="sheet.add.comingSoon" />
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
