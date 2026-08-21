import { Sparkles, X } from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from './button'
import { Card } from './card'

type SuggestionCardProps = {
  titleId: string
  descriptionId: string
  actionId: string
  dismissLabelId?: string
  onAction?: () => void
  onDismiss?: () => void
}

export const SuggestionCard = ({
  titleId,
  descriptionId,
  actionId,
  dismissLabelId,
  onAction,
  onDismiss,
}: SuggestionCardProps) => {
  const intl = useIntl()

  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary/15 p-3 text-primary">
          <Sparkles aria-hidden="true" size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              <FormattedMessage id={titleId} />
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              <FormattedMessage id={descriptionId} />
            </p>
          </div>
          <Button variant="secondary" className="rounded-full" onClick={onAction}>
            <FormattedMessage id={actionId} />
          </Button>
        </div>
        {onDismiss && dismissLabelId ? (
          <button
            type="button"
            aria-label={intl.formatMessage({ id: dismissLabelId })}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onDismiss}
          >
            <X aria-hidden="true" size={16} />
          </button>
        ) : null}
      </div>
    </Card>
  )
}
