import { Link } from '@tanstack/react-router'
import { Compass, Settings2 } from 'lucide-react'
import { useIntl } from 'react-intl'

type TopBarProps = {
  titleId: string
  hideSettings?: boolean
}

export function TopBar({ titleId, hideSettings = false }: TopBarProps) {
  const intl = useIntl()

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <span
            data-testid="shell-section-icon"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary"
          >
            <Compass aria-hidden="true" size={21} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {intl.formatMessage({ id: titleId })}
          </h1>
        </div>

        {!hideSettings ? (
          <Link
            to="/settings"
            aria-label={intl.formatMessage({ id: 'nav.settings' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/90 text-foreground transition-colors hover:bg-muted"
          >
            <Settings2 aria-hidden="true" size={20} />
          </Link>
        ) : null}
      </div>
    </header>
  )
}
