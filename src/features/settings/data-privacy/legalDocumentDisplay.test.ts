import { describe, expect, it } from 'vitest'

import { getLegalDocumentDisplayBody } from './legalDocumentDisplay'

describe('legal document display body', () => {
  it('keeps only the title and effective date before the first section', () => {
    const body = [
      '# Habit Compass Terms of Service',
      '',
      'Version: `1.0.0`',
      '',
      'Effective date: `July 15, 2026`',
      '',
      'Provider: `Jaime Canovas`',
      '',
      'Support: `habitcompassapp@gmail.com`',
      '',
      'Hosted Terms URL: `https://habit-compass.onrender.com/legal/terms`',
      '',
      '## 1. About These Terms',
      '',
      'These Terms govern your use of Habit Compass.',
    ].join('\n')

    expect(getLegalDocumentDisplayBody(body)).toBe(
      [
        '# Habit Compass Terms of Service',
        'Effective date: `July 15, 2026`',
        '',
        '## 1. About These Terms',
        '',
        'These Terms govern your use of Habit Compass.',
      ].join('\n'),
    )
  })

  it('supports the Spanish effective-date label', () => {
    const body = [
      '# Terminos de Servicio de Habit Compass',
      'Version: `1.0.0`',
      'Fecha de entrada en vigor: `July 15, 2026`',
      'Proveedor: `Jaime Canovas`',
      '## 1. Sobre Estos Terminos',
    ].join('\n')

    expect(getLegalDocumentDisplayBody(body)).toBe(
      [
        '# Terminos de Servicio de Habit Compass',
        'Fecha de entrada en vigor: `July 15, 2026`',
        '',
        '## 1. Sobre Estos Terminos',
      ].join('\n'),
    )
  })

  it('leaves documents without numbered sections unchanged', () => {
    expect(getLegalDocumentDisplayBody('No numbered section')).toBe('No numbered section')
  })
})
