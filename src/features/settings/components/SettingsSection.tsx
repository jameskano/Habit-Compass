import type { ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { Card } from '@/shared/ui/card'

type SettingsSectionProps = {
  titleId?: string
  children: ReactNode
}

export const SettingsSection = ({ children, titleId }: SettingsSectionProps) => (
  <Card className="space-y-2 p-3">
    {titleId ? (
      <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
        <FormattedMessage id={titleId} />
      </h2>
    ) : null}
    <div className="space-y-1">{children}</div>
  </Card>
)
