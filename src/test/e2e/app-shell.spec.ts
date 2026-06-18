import { expect, test } from '@playwright/test'

test('loads the app shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Today', level: 1, exact: true })).toBeVisible()
  await expect(page.getByTestId('shell-section-icon')).toBeVisible()
  await expect(page.getByText('Habit Compass')).toHaveCount(0)
})

test('add menu opens the four focused creation flows', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add item' }).click()
  const addSheet = page.getByRole('dialog', { name: 'Choose what to create' })
  await expect(addSheet.getByRole('button', { name: 'Habit' })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: 'Task', exact: true })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: 'Recurrent task' })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: 'Category' })).toBeVisible()
  await expect(addSheet.getByText('Reflection')).toHaveCount(0)
  await expect(addSheet.getByText('Quick capture')).toHaveCount(0)

  await addSheet.getByRole('button', { name: 'Habit' }).click()
  await expect(page.getByRole('heading', { name: 'Create habit' })).toBeVisible()
  await expect(page.getByText('Step 1 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Step 2 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Step 3 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Task', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Create task' })).toBeVisible()
  await expect(page.getByRole('checkbox')).toBeChecked()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Recurrent task' })
    .click()
  await expect(page.getByRole('heading', { name: 'Create recurrent task' })).toBeVisible()
  await expect(page.getByText('Step 1 of 2')).toBeVisible()
  await expect(page.getByText('Certain times per period')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Category' })
    .click()
  await expect(page.getByRole('heading', { name: 'Create category' })).toBeVisible()
})

test('re-clicking an open item-form dropdown keeps its creation screen open', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Task', exact: true })
    .click()

  const prioritySelect = page.getByRole('combobox', { name: 'Priority' })
  const triggerBounds = await prioritySelect.boundingBox()
  if (!triggerBounds) {
    throw new Error('Expected the priority trigger to be visible.')
  }
  await prioritySelect.click()
  await expect(page.getByRole('listbox')).toBeVisible()

  await page.mouse.click(
    triggerBounds.x + triggerBounds.width / 2,
    triggerBounds.y + triggerBounds.height / 2,
  )

  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Create task' })).toBeVisible()
})

test('items header search focuses each active tab filter', async ({ page }) => {
  await page.goto('/items')

  await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
  await expect(page.getByText('Active items')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Search habits' })).toHaveCount(0)
  await expect(page.getByLabel('Wellbeing').first()).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Recurrent Tasks' })).toBeVisible()
  await page.getByRole('button', { name: 'Search Recurrent Tasks' }).click()
  await expect(page.getByRole('textbox', { name: 'Search recurrent tasks' })).toBeFocused()
})

test('item swipe tracks the pointer and the header title uses calm motion', async ({ page }) => {
  await page.goto('/items')

  const habitCard = page.getByRole('button', { name: 'Open options for Read before bed' })
  await habitCard.dispatchEvent('pointerdown', { clientX: 100, clientY: 20 })
  await habitCard.dispatchEvent('pointermove', { clientX: 60, clientY: 20 })
  await expect(habitCard).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -40, 0)')
  await habitCard.dispatchEvent('pointerup', { clientX: 60, clientY: 20 })
  await expect(habitCard).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')

  await page.getByRole('tab', { name: 'Recurrent Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Recurrent Tasks' }).locator('span')).toHaveClass(
    /shell-title-enter/,
  )
})

test('habit overlay, legend, and stats periods use the revised presentation', async ({ page }) => {
  await page.goto('/items')

  await page.getByRole('button', { name: 'Options for Move for 20 minutes', exact: true }).click()
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
