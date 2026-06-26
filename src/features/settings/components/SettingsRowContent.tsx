import { ChevronRight } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import type { SettingsRowContentProps } from './settingsRow.types'
import {
  getSettingsRowIconClassName,
  getSettingsRowLabelClassName,
} from './settingsRow.utils'

export const SettingsRowContent = ({
  badgeId,
  descriptionId,
  destructive = false,
  icon: Icon,
  interactive,
  labelId,
  valueId,
}: SettingsRowContentProps) => (
  <>
    <span className={getSettingsRowIconClassName(destructive)}>
      <Icon aria-hidden size={18} />
    </span>
    <span className="min-w-0 flex-1">
      <span className={getSettingsRowLabelClassName(destructive)}>
        <FormattedMessage id={labelId} />
      </span>
      {descriptionId ? (
        <span className="mt-0.5 block text-sm text-muted-foreground">
          <FormattedMessage id={descriptionId} />
        </span>
      ) : null}
    </span>
    {valueId ? (
      <span className="shrink-0 text-sm text-muted-foreground">
        <FormattedMessage id={valueId} />
      </span>
    ) : null}
    {badgeId ? (
      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <FormattedMessage id={badgeId} />
      </span>
    ) : null}
    {interactive ? (
      <ChevronRight aria-hidden className="shrink-0 text-muted-foreground" size={18} />
    ) : null}
  </>
)
