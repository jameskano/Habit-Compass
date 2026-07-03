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
  variant?: 'public' | 'settings'
}

export const LegalDocumentPage = ({ kind, variant = 'settings' }: LegalDocumentPageProps) => {
  const intl = useIntl()
  const document = getLegalDocument(kind, intl.locale)
  const version = getLegalDocumentMetadataValue(document.body, ['Version'])
  const effectiveDate = getLegalDocumentMetadataValue(document.body, [
    'Effective date',
    'Fecha de entrada en vigor',
  ])
  useShellTitle(document.titleMessageId)

  const shellLeading = useMemo(
    () => (variant === 'settings' ? <BackButton to="/settings/data-privacy" /> : null),
    [variant],
  )
  useShellLeading(shellLeading)

  return (
    <section
      className={variant === 'public' ? 'mx-auto max-w-3xl space-y-4 p-4 sm:p-6' : 'space-y-4'}
    >
      {variant === 'public' ? (
        <h1 className="text-2xl font-semibold tracking-tight">
          <FormattedMessage id={document.titleMessageId} />
        </h1>
      ) : null}

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

export const PublicPrivacyPolicyPage = () => (
  <main className="min-h-dvh bg-background">
    <LegalDocumentPage kind="privacyPolicy" variant="public" />
  </main>
)

export const PublicTermsOfServicePage = () => (
  <main className="min-h-dvh bg-background">
    <LegalDocumentPage kind="termsOfService" variant="public" />
  </main>
)
