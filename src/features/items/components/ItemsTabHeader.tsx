import { Archive, Search } from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'

type ItemsTabHeaderProps = {
  titleId: string
  showingArchived: boolean
  onToggleArchive: () => void
}

export function ItemsTabHeader({
  titleId,
  showingArchived,
  onToggleArchive,
}: ItemsTabHeaderProps) {
  const intl = useIntl()
  const title = intl.formatMessage({ id: titleId })

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          <FormattedMessage id={titleId} />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id={showingArchived ? 'page.items.view.archived' : 'page.items.view.active'}
          />
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full border border-border/70 p-0 text-muted-foreground"
          aria-label={intl.formatMessage({ id: 'page.items.action.search' }, { tab: title })}
          title={intl.formatMessage({ id: 'page.items.action.searchUnavailable' })}
          disabled
        >
          <Search aria-hidden="true" size={18} />
        </Button>
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full border border-border/70 p-0 text-muted-foreground"
          aria-label={intl.formatMessage(
            { id: showingArchived ? 'page.items.action.showActive' : 'page.items.action.showArchived' },
            { tab: title },
          )}
          aria-pressed={showingArchived}
          onClick={onToggleArchive}
        >
          <Archive aria-hidden="true" size={18} />
        </Button>
      </div>
    </div>
  )
}
