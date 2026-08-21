import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { Calendar } from './calendar'

const renderCalendar = (locale: 'en' | 'es') => {
  const selectedDate = new Date(2026, 7, 3)

  render(
    <IntlProvider locale={locale} messages={getMessages(locale)}>
      <Calendar mode="single" month={selectedDate} selected={selectedDate} today={selectedDate} />
    </IntlProvider>,
  )
}

describe('Calendar', () => {
  it('uses the fixed full-date format and localized state in English labels', () => {
    renderCalendar('en')

    expect(screen.getByRole('button', { name: 'Today, 03/08/2026, selected' })).toBeInTheDocument()
  })

  it('uses the same full-date format and localized state in Spanish labels', () => {
    renderCalendar('es')

    expect(
      screen.getByRole('button', { name: 'Hoy, 03/08/2026, seleccionado' }),
    ).toBeInTheDocument()
  })
})
