import { Sparkles } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { Button } from './button'
import { Card } from './card'

type SuggestionCardProps = {
  titleId: string
  descriptionId: string
  actionId: string
}

export function SuggestionCard({ titleId, descriptionId, actionId }: SuggestionCardProps) {
  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary/15 p-3 text-primary">
          <Sparkles aria-hidden="true" size={18} />
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              <FormattedMessage id={titleId} />
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              <FormattedMessage id={descriptionId} />
            </p>
          </div>
          <Button variant="secondary" className="rounded-full">
            <FormattedMessage id={actionId} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
