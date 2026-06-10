import { X, type LucideIcon } from 'lucide-react'
import { Fragment } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'

export type TodayMenuAction = {
  labelId: string
  icon?: LucideIcon
  onSelect: () => void
  dividerBefore?: boolean
}

type TodayActionSheetProps = {
  title: string
  open: boolean
  actions: TodayMenuAction[]
  onClose: () => void
}

export function TodayActionSheet({ title, open, actions, onClose }: TodayActionSheetProps) {
  const intl = useIntl()

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <SheetContent
        aria-label={intl.formatMessage({ id: 'page.today.menu.title' }, { item: title })}
        aria-describedby={undefined}
        className="animate-[habit-sheet-in_300ms_ease-out] w-full rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-2xl motion-reduce:animate-none md:mx-auto md:mb-8 md:max-w-lg md:rounded-[2rem]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <SheetTitle className="sr-only">
            {intl.formatMessage({ id: 'page.today.menu.title' }, { item: title })}
          </SheetTitle>
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            type="button"
            className="h-10 w-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.close' })}
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <div role="menu" className="space-y-2">
          {actions.map(({ labelId, icon: Icon, onSelect, dividerBefore }) => (
            <Fragment key={labelId}>
              {dividerBefore ? <hr className="my-3 border-border/70" aria-hidden="true" /> : null}
              <Button
                role="menuitem"
                variant="ghost"
                type="button"
                onClick={onSelect}
                className="w-full justify-between rounded-xl border border-transparent px-3"
              >
                <span className="inline-flex items-center gap-3">
                  {Icon ? <Icon aria-hidden="true" size={17} /> : null}
                  {intl.formatMessage({ id: labelId })}
                </span>
              </Button>
            </Fragment>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
