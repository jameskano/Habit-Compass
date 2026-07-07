import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'

type AuthShellProps = {
  children: ReactNode
  titleId: string
  descriptionId?: string
  footer?: ReactNode
}

export const AuthShell = ({ children, descriptionId, footer, titleId }: AuthShellProps) => (
  <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
    <Card className="w-full max-w-md space-y-5 p-5">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Habit Compass
        </p>
        <h1 className="text-2xl font-semibold">
          <FormattedMessage id={titleId} />
        </h1>
        {descriptionId ? (
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
    </Card>
  </main>
)

export const AuthTextLink = ({
  children,
  className,
  to,
}: {
  children: ReactNode
  className?: string
  to: string
}) => (
  <Link
    className={cn('font-medium text-primary underline-offset-4 hover:underline', className)}
    to={to as never}
  >
    {children}
  </Link>
)
