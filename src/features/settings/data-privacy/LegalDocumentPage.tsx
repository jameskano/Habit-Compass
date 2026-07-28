import { useMemo } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { BackButton } from '@/shared/ui/BackButton'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { getLegalDocumentDisplayBody } from './legalDocumentDisplay'
import { getLegalDocument, type LegalDocumentKind } from './legalDocuments'
import { MarkdownDocument } from './MarkdownDocument'

type LegalDocumentPageProps = {
  kind: LegalDocumentKind
  variant?: 'public' | 'settings'
}

export const LegalDocumentPage = ({ kind, variant = 'settings' }: LegalDocumentPageProps) => {
  const intl = useIntl()
  const document = getLegalDocument(kind, intl.locale)
  const displayBody = getLegalDocumentDisplayBody(document.body)
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

      <Card className="p-4 sm:p-6" data-testid="legal-document-card">
        <MarkdownDocument body={displayBody} />
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
