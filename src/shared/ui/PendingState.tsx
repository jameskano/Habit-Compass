import { LoaderCircle } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { cn } from '@/shared/utils/cn'

type PendingStateProps = {
  messageId?: string
  className?: string
}

export const PendingState = ({ messageId, className }: PendingStateProps) => {
  return (
    <div
      className={cn('flex min-h-40 items-center justify-center px-4 py-10', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <LoaderCircle aria-hidden className="animate-spin text-primary" size={22} />
        {messageId ? (
          <p className="text-sm font-medium text-foreground">
            <FormattedMessage id={messageId} />
          </p>
        ) : null}
      </div>
    </div>
  )
}
