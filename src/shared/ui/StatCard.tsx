import { type ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { Card } from './card'

type StatCardProps = {
  labelId: string
  value: ReactNode
  detailId?: string
}

export function StatCard({ labelId, value, detailId }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/90 p-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <FormattedMessage id={labelId} />
        </p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {detailId ? (
          <p className="text-sm text-muted-foreground">
            <FormattedMessage id={detailId} />
          </p>
        ) : null}
      </div>
    </Card>
  )
}
