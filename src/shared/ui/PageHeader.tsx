import { type ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

type PageHeaderProps = {
  titleId: string
  descriptionId?: string
  eyebrowId?: string
  actions?: ReactNode
}

export function PageHeader({ titleId, descriptionId, eyebrowId, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {eyebrowId ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <FormattedMessage id={eyebrowId} />
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            <FormattedMessage id={titleId} />
          </h1>
          {descriptionId ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              <FormattedMessage id={descriptionId} />
            </p>
          ) : null}
        </div>
        {actions}
      </div>
    </div>
  )
}
