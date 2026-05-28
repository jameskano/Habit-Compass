import { expect, test } from '@playwright/test'

test('loads the app shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Today', level: 1, exact: true })).toBeVisible()
  await expect(page.getByTestId('shell-section-icon')).toBeVisible()
  await expect(page.getByText('Habit Compass')).toHaveCount(0)
})

test('items header search focuses each active tab filter', async ({ page }) => {
  await page.goto('/items')

  await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
  await expect(page.getByText('Active items')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Search habits' })).toHaveCount(0)
  await expect(page.getByLabel('Health').first()).toBeVisible()
  await expect(page.getByLabel('Priority: Medium').first()).toBeVisible()
  await page.getByRole('button', { name: 'Show archived Habits' }).click()
  await expect(page.getByRole('button', { name: 'Show active Habits' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Show active Habits' })).toHaveClass(/text-primary/)
  await page.getByRole('button', { name: 'Show active Habits' }).click()
  await page.getByRole('button', { name: 'Search Habits' }).click()
  await expect(page.getByRole('textbox', { name: 'Search habits' })).toBeFocused()
  await page.getByRole('textbox', { name: 'Search habits' }).fill('Read')
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('textbox', { name: 'Search habits' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Tasks', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await page.getByRole('button', { name: 'Search Tasks' }).click()
  await expect(page.getByRole('textbox', { name: 'Search tasks' })).toBeFocused()

  await page.getByRole('tab', { name: 'Recurrent Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await page.getByRole('button', { name: 'Search Recurrent Tasks' }).click()
  await expect(page.getByRole('textbox', { name: 'Search recurrent tasks' })).toBeFocused()
})

test('habit overlay, legend, and stats periods use the revised presentation', async ({ page }) => {
  await page.goto('/items')

  await page
    .getByRole('button', { name: 'Options for Move for 20 minutes', exact: true })
    .click()
  const menu = page.getByRole('dialog', { name: 'Options for Move for 20 minutes' })
  await expect(menu.getByText('Habit actions')).toHaveCount(0)
  await expect(menu).toHaveClass(/animate-\[habit-sheet-in_300ms_ease-out\]/)
  await menu.getByRole('menuitem', { name: 'Calendar' }).click()

  const detail = page.getByRole('dialog', { name: 'Habit detail for Move for 20 minutes' })
  const legend = detail.getByLabel('Calendar state legend')
  await expect(legend.getByText('Pending today')).toHaveCount(0)
  await detail.getByRole('tab', { name: 'Stats' }).click()

  const chart = detail.getByLabel('Completion chart')
  await detail.getByRole('tab', { name: 'Month' }).click()
  await expect(chart.locator('span[title]')).toHaveCount(12)
  await detail.getByRole('tab', { name: 'Year' }).click()
  await expect(chart.locator('span[title]')).toHaveCount(1)
})
