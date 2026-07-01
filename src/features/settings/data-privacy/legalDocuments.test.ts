import { describe, expect, it } from 'vitest'

import { getLegalDocument, type LegalDocumentKind } from './legalDocuments'

const documentKinds: LegalDocumentKind[] = ['privacyPolicy', 'termsOfService']

describe('legal document drafts', () => {
  it('provides English and Spanish local drafts for each legal document', () => {
    for (const kind of documentKinds) {
      const english = getLegalDocument(kind, 'en')
      const spanish = getLegalDocument(kind, 'es')

      expect(english.kind).toBe(kind)
      expect(spanish.kind).toBe(kind)
      expect(english.body).toContain('Version:')
      expect(spanish.body).toContain('Version:')
      expect(english.body).toContain('[EFFECTIVE DATE]')
      expect(spanish.body).toContain('[EFFECTIVE DATE]')
    }
  })

  it('falls back to English for unsupported runtime locales', () => {
    expect(getLegalDocument('privacyPolicy', 'fr').body).toContain('Habit Compass Privacy Policy')
  })
})
