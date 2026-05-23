import { Sparkles } from 'lucide-react'
import { type ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { Card } from './card'

type EmptyStateProps = {
  titleId: string
  descriptionId: string
  action?: ReactNode
}

export function EmptyState({ titleId, descriptionId, action }: EmptyStateProps) {
  return (
    <Card className="rounded-2xl border-dashed bg-card/80 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
          <Sparkles aria-hidden="true" size={18} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            <FormattedMessage id={titleId} />
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </p>
          {action}
        </div>
      </div>
    </Card>
  )
}
