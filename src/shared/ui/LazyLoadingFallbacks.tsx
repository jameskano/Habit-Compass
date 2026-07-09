import { LoaderCircle } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { PendingState } from './PendingState'

export const RoutePendingState = () => (
  <PendingState messageId="shared.lazy.route.title" className="min-h-dvh" />
)

export const OverlayPendingState = () => (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 backdrop-blur-sm"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-5 py-4 shadow-xl">
      <LoaderCircle aria-hidden className="animate-spin text-primary" size={20} />
      <span className="text-sm font-medium text-foreground">
        <FormattedMessage id="shared.lazy.feature" />
      </span>
    </div>
  </div>
)

export const CalendarPendingState = () => (
  <div
    className="grid h-[292px] w-[280px] place-items-center text-muted-foreground"
    role="status"
    aria-live="polite"
  >
    <span className="flex items-center gap-2 text-sm">
      <LoaderCircle aria-hidden className="animate-spin" size={18} />
      <FormattedMessage id="shared.lazy.calendar" />
    </span>
  </div>
)
