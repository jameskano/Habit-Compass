import { Link } from '@tanstack/react-router'
import { Compass, Settings2 } from 'lucide-react'
import { useIntl } from 'react-intl'

type TopBarProps = {
  hideSettings?: boolean
}

export function TopBar({ hideSettings = false }: TopBarProps) {
  const intl = useIntl()

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/today" className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary/15 p-2 text-primary">
            <Compass aria-hidden="true" size={20} />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-foreground">
              {intl.formatMessage({ id: 'app.name' })}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {intl.formatMessage({ id: 'app.tagline' })}
            </p>
          </div>
        </Link>

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
