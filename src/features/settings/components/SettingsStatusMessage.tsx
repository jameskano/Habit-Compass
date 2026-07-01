import { FormattedMessage } from 'react-intl'

import { cn } from '@/shared/utils/cn'

type SettingsStatusTone = 'success' | 'error'

type SettingsStatusMessageProps = {
  messageId: string
  tone: SettingsStatusTone
  role?: 'alert' | 'status'
  appearance?: 'plain' | 'bordered'
}

export const SettingsStatusMessage = ({
  appearance = 'plain',
  messageId,
  role,
  tone,
}: SettingsStatusMessageProps) => (
  <p
    className={cn(
      appearance === 'bordered'
        ? 'rounded-lg border px-4 py-3 text-sm'
        : 'rounded-xl px-3 py-2 text-sm',
      tone === 'success' && appearance === 'bordered'
        ? 'border-primary/20 bg-primary/10 text-primary'
        : null,
      tone === 'error' && appearance === 'bordered'
        ? 'border-destructive/20 bg-destructive/10 text-destructive'
        : null,
      tone === 'success' && appearance === 'plain'
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : null,
      tone === 'error' && appearance === 'plain' ? 'bg-destructive/10 text-destructive' : null,
    )}
    role={role}
  >
    <FormattedMessage id={messageId} />
  </p>
)
