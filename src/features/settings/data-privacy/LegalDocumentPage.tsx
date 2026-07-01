import { useMemo } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { BackButton } from '@/shared/ui/BackButton'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { getLegalDocumentMetadataValue } from './legalDocumentMetadata'
import { getLegalDocument, type LegalDocumentKind } from './legalDocuments'
import { MarkdownDocument } from './MarkdownDocument'

type LegalDocumentPageProps = {
  kind: LegalDocumentKind
}

export const LegalDocumentPage = ({ kind }: LegalDocumentPageProps) => {
  const intl = useIntl()
  const document = getLegalDocument(kind, intl.locale)
  const version = getLegalDocumentMetadataValue(document.body, ['Version'])
  const effectiveDate = getLegalDocumentMetadataValue(document.body, [
    'Effective date',
    'Fecha de entrada en vigor',
  ])
  useShellTitle(document.titleMessageId)

  const shellLeading = useMemo(() => <BackButton to="/settings/data-privacy" />, [])
  useShellLeading(shellLeading)

  return (
    <section className="space-y-4">
      <Card className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="settings.legal.localDraftNotice" />
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/45 p-3">
            <dt className="font-medium text-muted-foreground">
              <FormattedMessage id="settings.legal.version" />
            </dt>
            <dd className="mt-1 font-semibold">{version}</dd>
          </div>
          <div className="rounded-lg bg-muted/45 p-3">
            <dt className="font-medium text-muted-foreground">
              <FormattedMessage id="settings.legal.effectiveDate" />
            </dt>
            <dd className="mt-1 font-semibold">{effectiveDate}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4 sm:p-6">
        <MarkdownDocument body={document.body} />
      </Card>
    </section>
  )
}

export const PrivacyPolicyPage = () => <LegalDocumentPage kind="privacyPolicy" />

export const TermsOfServicePage = () => <LegalDocumentPage kind="termsOfService" />
