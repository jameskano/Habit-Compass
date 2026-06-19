import privacyPolicyEn from '../../../../docs/legal/privacy-policy.en.md?raw'
import privacyPolicyEs from '../../../../docs/legal/privacy-policy.es.md?raw'
import termsOfServiceEn from '../../../../docs/legal/terms-of-service.en.md?raw'
import termsOfServiceEs from '../../../../docs/legal/terms-of-service.es.md?raw'

import type { ResolvedAppLocale } from '@/domain/settings'

export type LegalDocumentKind = 'privacyPolicy' | 'termsOfService'

export type LegalDocument = {
  kind: LegalDocumentKind
  titleMessageId: string
  body: string
}

const legalDocuments: Record<LegalDocumentKind, Record<ResolvedAppLocale, LegalDocument>> = {
  privacyPolicy: {
    en: {
      kind: 'privacyPolicy',
      titleMessageId: 'settings.legal.privacy.title',
      body: privacyPolicyEn,
    },
    es: {
      kind: 'privacyPolicy',
      titleMessageId: 'settings.legal.privacy.title',
      body: privacyPolicyEs,
    },
  },
  termsOfService: {
    en: {
      kind: 'termsOfService',
      titleMessageId: 'settings.legal.terms.title',
      body: termsOfServiceEn,
    },
    es: {
      kind: 'termsOfService',
      titleMessageId: 'settings.legal.terms.title',
      body: termsOfServiceEs,
    },
  },
}

export const getLegalDocument = (kind: LegalDocumentKind, locale: string): LegalDocument => {
  const resolvedLocale: ResolvedAppLocale = locale.startsWith('es') ? 'es' : 'en'
  return legalDocuments[kind][resolvedLocale]
}
