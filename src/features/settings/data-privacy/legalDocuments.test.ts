import { describe, expect, it } from 'vitest'

import { getLegalDocument, type LegalDocumentKind } from './legalDocuments'

const documentKinds: LegalDocumentKind[] = ['privacyPolicy', 'termsOfService']

describe('legal documents', () => {
  it('provides English and Spanish local documents for each legal document', () => {
    for (const kind of documentKinds) {
      const english = getLegalDocument(kind, 'en')
      const spanish = getLegalDocument(kind, 'es')

      expect(english.kind).toBe(kind)
      expect(spanish.kind).toBe(kind)
      expect(english.body).toContain('Version:')
      expect(spanish.body).toContain('Version:')
      expect(english.body).toContain('July 15, 2026')
      expect(spanish.body).toContain('July 15, 2026')
    }
  })

  it('uses confirmed release identity facts in both locales', () => {
    for (const kind of documentKinds) {
      for (const locale of ['en', 'es']) {
        const document = getLegalDocument(kind, locale)

        expect(document.body).toContain('Jaime Canovas')
        expect(document.body).toContain('jaimecanovasdesign@gmail.com')
        expect(document.body).toContain('Spain')
        expect(document.body).toContain('`1.0.0`')
        expect(document.body).toContain('`16`')
        expect(document.body).not.toContain('[BUSINESS OR CONTACT ADDRESS]')
      }
    }
  })

  it('uses the public Render URLs in both locales', () => {
    for (const locale of ['en', 'es']) {
      const privacyPolicy = getLegalDocument('privacyPolicy', locale)
      const terms = getLegalDocument('termsOfService', locale)

      expect(privacyPolicy.body).toContain(
        'https://habit-compass.onrender.com/legal/privacy-policy',
      )
      expect(privacyPolicy.body).toContain('https://habit-compass.onrender.com/account/delete')
      expect(terms.body).toContain('https://habit-compass.onrender.com/legal/terms')
      expect(terms.body).toContain('https://habit-compass.onrender.com/legal/privacy-policy')
      expect(terms.body).toContain('https://habit-compass.onrender.com/account/delete')
      expect(privacyPolicy.body).not.toContain('[HOSTED PRIVACY POLICY URL]')
      expect(privacyPolicy.body).not.toContain('[PUBLIC ACCOUNT DELETION URL]')
      expect(terms.body).not.toContain('[HOSTED TERMS URL]')
      expect(terms.body).not.toContain('[HOSTED PRIVACY POLICY URL]')
      expect(terms.body).not.toContain('[PUBLIC ACCOUNT DELETION URL]')
    }
  })

  it('does not expose draft or publication-checklist language in public documents', () => {
    for (const kind of documentKinds) {
      for (const locale of ['en', 'es']) {
        const document = getLegalDocument(kind, locale)

        expect(document.body).not.toMatch(/\[[A-Z0-9 /_-]+(?:TO CONFIRM)?\]/)
        expect(document.body).not.toMatch(/Release Draft Notice|Aviso De Borrador/i)
        expect(document.body).not.toMatch(/Before Publication|Antes De Publicar/i)
        expect(document.body).not.toMatch(/pre-release draft|borrador previo/i)
        expect(document.body).not.toMatch(
          /resolve every placeholder|resuelve todos los marcadores/i,
        )
      }
    }
  })

  it('describes retention and provider unknowns without placeholder text', () => {
    for (const locale of ['en', 'es']) {
      const document = getLegalDocument('privacyPolicy', locale)

      expect(document.body).toMatch(/6 months|6 meses/i)
      expect(document.body).toMatch(/do(?:es)? not\s+retain|no conserva/i)
      expect(document.body).toContain('Supabase, Inc.')
      expect(document.body).toContain('RevenueCat, Inc.')
      expect(document.body).not.toContain('[DATA RETENTION PERIOD]')
      expect(document.body).not.toContain('[LEGAL BASIS TO CONFIRM]')
      expect(document.body).not.toContain('[PROCESSOR OR SUBPROCESSOR DETAILS TO CONFIRM]')
    }
  })

  it('does not keep removed Terms-specific legal placeholders', () => {
    for (const locale of ['en', 'es']) {
      const document = getLegalDocument('termsOfService', locale)

      expect(document.body).not.toContain('[SERVICE WARRANTY / DISCLAIMER LANGUAGE TO CONFIRM]')
      expect(document.body).not.toContain('[LIABILITY TERMS TO CONFIRM]')
      expect(document.body).not.toContain('[GOVERNING LAW TO CONFIRM]')
      expect(document.body).not.toContain('[JURISDICTION / DISPUTE FORUM TO CONFIRM]')
      expect(document.body).toMatch(/Spain|Espana/i)
    }
  })

  it('does not describe legacy scheduled deletion as the active legal behavior', () => {
    for (const kind of documentKinds) {
      for (const locale of ['en', 'es']) {
        const document = getLegalDocument(kind, locale)

        expect(document.body).not.toMatch(/scheduled for permanent deletion/i)
        expect(document.body).not.toMatch(/account deletion scheduled/i)
        expect(document.body).not.toMatch(/seven-day deletion/i)
        expect(document.body).toMatch(/immediate|inmediata/i)
      }
    }
  })

  it('does not present optional future processing as active by default', () => {
    for (const locale of ['en', 'es']) {
      const privacyPolicy = getLegalDocument('privacyPolicy', locale)
      const terms = getLegalDocument('termsOfService', locale)

      expect(privacyPolicy.body).toContain('VITE_SENTRY_DSN')
      expect(privacyPolicy.body).toMatch(/not active|no estan activos/i)
      expect(privacyPolicy.body).toMatch(/does not sell|no vende/i)
      expect(privacyPolicy.body).toMatch(/AI features are not active|funciones de IA no estan/i)
      expect(terms.body).not.toMatch(/AI insights are included/i)
      expect(terms.body).not.toMatch(/notifications are enabled/i)
    }
  })

  it('falls back to English for unsupported runtime locales', () => {
    expect(getLegalDocument('privacyPolicy', 'fr').body).toContain('Habit Compass Privacy Policy')
  })
})
