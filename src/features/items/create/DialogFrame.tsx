import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type DialogFrameProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

export const DialogFrame = ({ title, children, onClose }: DialogFrameProps) => {
  const intl = useIntl()

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,52rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
            <Button
              variant="ghost"
              className="size-10 rounded-full border border-border/70 p-0"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={onClose}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
