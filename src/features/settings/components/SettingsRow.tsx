import { Link } from '@tanstack/react-router'
import { useIntl } from 'react-intl'

import { SettingsRowContent } from './SettingsRowContent'
import type { SettingsRowProps } from './settingsRow.types'
import { getSettingsRowClassName } from './settingsRow.utils'

export const SettingsRow = ({
  ariaLabelId,
  disabled = false,
  onClick,
  to,
  ...contentProps
}: SettingsRowProps) => {
  const intl = useIntl()
  const interactive = Boolean(to || onClick)
  const className = getSettingsRowClassName({ disabled, interactive })
  const content = <SettingsRowContent {...contentProps} interactive={interactive} />

  if (to) {
    return (
      <Link
        to={to}
        aria-label={ariaLabelId ? intl.formatMessage({ id: ariaLabelId }) : undefined}
        className={className}
      >
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className={className} disabled={disabled} type="button" onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <div aria-disabled={disabled || undefined} className={className}>
      {content}
    </div>
  )
}
