import { X } from 'lucide-react'
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from './button'
import { CreateItemDialogs } from '@/features/items/create/CreateItemDialogs'

type AddItemSheetProps = {
  open: boolean
  onClose: () => void
}

const options = [
  { kind: 'habit', messageId: 'sheet.add.habit' },
  { kind: 'task', messageId: 'sheet.add.task' },
  { kind: 'recurrentTask', messageId: 'sheet.add.recurrentTask' },
  { kind: 'category', messageId: 'sheet.add.category' },
] as const

export const AddItemSheet = ({ open, onClose }: AddItemSheetProps) => {
  const intl = useIntl()
  const [createKind, setCreateKind] = useState<(typeof options)[number]['kind'] | null>(null)

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

  if (!open && !createKind) {
    return null
  }

  const handleContainerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  return createKind ? (
    <CreateItemDialogs
      kind={createKind}
      onClose={() => {
        setCreateKind(null)
        onClose()
      }}
    />
  ) : (
    <div
      className="fixed inset-0 z-40 flex items-end bg-foreground/35 backdrop-blur-sm"
      onClick={onClose}
    >
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
          {options.map((option) => (
            <Button
              key={option.kind}
              variant="secondary"
              className="w-full justify-between rounded-2xl border border-border/60 px-4 py-4 text-left"
              onClick={() => setCreateKind(option.kind)}
            >
              <span>
                <FormattedMessage id={option.messageId} />
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
