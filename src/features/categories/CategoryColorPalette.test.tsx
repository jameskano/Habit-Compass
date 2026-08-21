import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntlProvider } from 'react-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { CategoryColorPalette } from './CategoryColorPalette'

const renderCategoryColorPalette = (onColorTokenChange = vi.fn()) =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <CategoryColorPalette open colorToken="emerald" onColorTokenChange={onColorTokenChange} />
    </IntlProvider>,
  )

describe('CategoryColorPalette', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView
  let scrollIntoView: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  it('keeps selected-color centering scoped to the palette scroller', () => {
    renderCategoryColorPalette()

    const palette = screen.getByLabelText('Category colors')
    const selectedColor = screen.getByRole('button', { name: 'Emerald' })

    expect(palette).toHaveClass('overflow-x-auto', 'overscroll-x-contain', 'overscroll-y-none')
    expect(selectedColor).toHaveAttribute('aria-pressed', 'true')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('updates the selected color when a swatch is chosen', async () => {
    const user = userEvent.setup()
    const onColorTokenChange = vi.fn()

    renderCategoryColorPalette(onColorTokenChange)

    await user.click(screen.getByRole('button', { name: 'Graphite' }))

    expect(onColorTokenChange).toHaveBeenCalledWith('graphite')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
