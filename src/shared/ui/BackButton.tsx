import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useIntl } from 'react-intl'

import { Button } from './button'

type BackButtonProps = {
  labelId?: string
  onClick?: () => void
  to?: ComponentProps<typeof Link>['to']
}

export const BackButton = ({ labelId = 'action.back', onClick, to }: BackButtonProps) => {
  const intl = useIntl()
  const label = intl.formatMessage({ id: labelId })
  const className = 'size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground'

  if (to) {
    return (
      <Button asChild variant="ghost" className={className}>
        <Link to={to} aria-label={label}>
          <ArrowLeft aria-hidden size={20} />
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="ghost" className={className} aria-label={label} onClick={onClick}>
      <ArrowLeft aria-hidden size={20} />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
