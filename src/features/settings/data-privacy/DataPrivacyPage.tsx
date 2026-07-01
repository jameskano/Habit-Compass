import { FileArchive, FileJson, FileText, ScrollText } from 'lucide-react'
import { useMemo } from 'react'
import { FormattedMessage } from 'react-intl'

import { BackButton } from '@/shared/ui/BackButton'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { SettingsRow } from '../components/SettingsRow'
import { SettingsStatusMessage } from '../components/SettingsStatusMessage'
import { useDataExportAction } from './useDataExportAction'

export const DataPrivacyPage = () => {
  const { exportData, isPending, status } = useDataExportAction()
  useShellTitle('settings.dataPrivacy.title')

  const shellLeading = useMemo(() => <BackButton to="/settings" />, [])
  useShellLeading(shellLeading)

  return (
    <section className="space-y-4">
      <Card className="space-y-2 p-3">
        <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          <FormattedMessage id="settings.dataPrivacy.title" />
        </h2>
        <div className="space-y-1">
          <SettingsRow
            disabled={isPending}
            icon={FileArchive}
            labelId="settings.dataPrivacy.export.csv.title"
            onClick={() => exportData('csv')}
          />
          <SettingsRow
            disabled={isPending}
            icon={FileJson}
            labelId="settings.dataPrivacy.export.json.title"
            onClick={() => exportData('json')}
          />
          <SettingsRow
            icon={FileText}
            labelId="settings.legal.privacy.title"
            to="/settings/data-privacy/privacy-policy"
          />
          <SettingsRow
            icon={ScrollText}
            labelId="settings.legal.terms.title"
            to="/settings/data-privacy/terms"
          />
        </div>
      </Card>

      {status !== 'idle' ? (
        <SettingsStatusMessage
          appearance="bordered"
          messageId={`settings.dataPrivacy.export.status.${status}`}
          role="status"
          tone={status === 'success' ? 'success' : 'error'}
        />
      ) : null}
    </section>
  )
}
