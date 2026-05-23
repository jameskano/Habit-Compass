import { CheckCircle2 } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { Card } from './card'

type ItemCardProps = {
  title?: string
  titleId?: string
  meta?: string
  metaId?: string
  tone?: 'habit' | 'task' | 'category' | 'neutral'
}

const toneStyles: Record<NonNullable<ItemCardProps['tone']>, string> = {
  habit: 'border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  task: 'border-sky-200/60 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/30',
  category: 'border-amber-200/60 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30',
  neutral: 'border-border/70 bg-card/90',
}

export function ItemCard({ title, titleId, meta, metaId, tone = 'neutral' }: ItemCardProps) {
  return (
    <Card className={`rounded-2xl p-4 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            {title ?? (titleId ? <FormattedMessage id={titleId} /> : null)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {meta ?? (metaId ? <FormattedMessage id={metaId} /> : null)}
          </p>
        </div>
        <div className="rounded-full bg-background/80 p-2 text-muted-foreground shadow-sm">
          <CheckCircle2 aria-hidden="true" size={18} />
        </div>
      </div>
    </Card>
  )
}
