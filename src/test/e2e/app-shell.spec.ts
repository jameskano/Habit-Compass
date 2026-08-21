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
  await expect(addSheet.getByRole('button', { name: /^Habit/ })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: /^Task/ })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: /^Recurrent task/ })).toBeVisible()
  await expect(addSheet.getByRole('button', { name: 'Category' })).toBeVisible()
  await expect(addSheet.getByText('Reflection')).toHaveCount(0)
  await expect(addSheet.getByText('Quick capture')).toHaveCount(0)

  await addSheet.getByRole('button', { name: /^Habit/ }).click()
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
    .getByRole('button', { name: /^Task/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Create task' })).toBeVisible()
  await expect(page.getByRole('checkbox')).toBeChecked()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: /^Recurrent task/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Create recurrent task' })).toBeVisible()
  await expect(page.getByText('Step 1 of 2')).toBeVisible()
  await expect(page.getByText('Certain days per period')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Category' })
    .click()
  await expect(page.getByRole('heading', { name: 'Create category' })).toBeVisible()
})

test('item date picker remains interactive inside its creation dialog', async ({ page }) => {
  await page.goto('/items')

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: /^Task/ })
    .click()

  const createDialog = page.getByRole('dialog', { name: 'Create task' })
  const dateTrigger = createDialog.getByRole('button', { name: 'Choose date' })
  const initialDate = await dateTrigger.textContent()

  await dateTrigger.click()

  const calendarDialog = page.getByRole('dialog', { name: 'Choose date' })
  await expect(calendarDialog).toBeVisible()
  const initialMonth = await calendarDialog.getByRole('status').textContent()

  await calendarDialog.getByRole('button', { name: 'Go to the Next Month' }).click()

  await expect(calendarDialog).toBeVisible()
  await expect(calendarDialog.getByRole('status')).not.toHaveText(initialMonth ?? '')
  await calendarDialog.getByRole('status').click()
  await expect(calendarDialog).toBeVisible()

  await calendarDialog.getByRole('button', { name: /^15\/\d{2}\/\d{4}$/ }).click()

  await expect(calendarDialog).toHaveCount(0)
  await expect(dateTrigger).not.toHaveText(initialDate ?? '')
  await expect(createDialog).toBeVisible()
})

test('re-clicking an open item-form dropdown keeps its creation screen open', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: /^Task/ })
    .click()
  await expect(page.locator('[role="status"].fixed.inset-0')).toHaveCount(0)

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
  const habitCardContainer = habitCard.locator('xpath=ancestor::*[@data-habit-card][1]')
  const editPreview = habitCardContainer.locator('xpath=..').locator('[data-swipe-action="edit"]')
  await habitCard.dispatchEvent('pointerdown', { clientX: 100, clientY: 20 })
  await habitCard.dispatchEvent('pointermove', { clientX: 60, clientY: 20 })
  await expect(habitCardContainer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -40, 0)')
  await expect(editPreview).toContainText('Edit')
  await expect(editPreview).toHaveAttribute('data-active', 'true')
  await expect(editPreview).toHaveAttribute('data-ready', 'false')
  await habitCard.dispatchEvent('pointerup', { clientX: 60, clientY: 20 })
  await expect(habitCardContainer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  await expect(editPreview).toHaveAttribute('data-active', 'false')

  await page.getByRole('tab', { name: 'Recurrent Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Recurrent Tasks' }).locator('span')).toHaveClass(
    /shell-title-enter/,
  )
})

test('task swipe completion keeps the mobile viewport and toast contained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/items')

  await page.getByRole('tab', { name: 'Tasks', exact: true }).click()
  const taskCard = page.getByRole('button', { name: 'Edit Call the clinic' })
  const completePreview = taskCard.locator('xpath=..').locator('[data-swipe-action="complete"]')
  await expect(taskCard).toBeVisible()

  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
  const taskBounds = await taskCard.boundingBox()
  if (!taskBounds) {
    throw new Error('Expected the task card to be visible.')
  }

  await page.mouse.move(taskBounds.x + 24, taskBounds.y + taskBounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(taskBounds.x + 120, taskBounds.y + taskBounds.height / 2)

  await expect(completePreview).toContainText('Complete')
  await expect(completePreview).toHaveAttribute('data-active', 'true')
  await expect(completePreview).toHaveAttribute('data-ready', 'true')

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(viewportWidth)

  await page.mouse.up()
  await expect(page.getByText('Call the clinic was completed.')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(viewportWidth)

  const toastBounds = await page.locator('[data-sonner-toast]').first().boundingBox()
  if (!toastBounds) {
    throw new Error('Expected the completion toast to be visible.')
  }

  expect(toastBounds.x).toBeGreaterThanOrEqual(0)
  expect(toastBounds.x + toastBounds.width).toBeLessThanOrEqual(viewportWidth)
})

test('item cards and reorder handles stay inside the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const assertViewportContained = async () => {
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth)

    for (const handle of await page.getByRole('button', { name: /^Drag to reorder / }).all()) {
      const bounds = await handle.boundingBox()
      if (!bounds) {
        throw new Error('Expected reorder handle to be visible.')
      }

      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewportWidth)
    }
  }

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today', level: 1, exact: true })).toBeVisible()
  await assertViewportContained()

  await page.goto('/items')
  await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
  await assertViewportContained()

  await page.getByRole('tab', { name: 'Tasks', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await assertViewportContained()

  await page.getByRole('tab', { name: 'Recurrent Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Recurrent Tasks' })).toBeVisible()
  await assertViewportContained()
})

test('category color palette scroll stays inside the bottom sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Add item' }).click()
  await page
    .getByRole('dialog', { name: 'Choose what to create' })
    .getByRole('button', { name: 'Category' })
    .click()

  const sheet = page.getByRole('dialog', { name: 'Create category' })
  const palette = sheet.getByLabel('Category colors')
  const sheetTitle = sheet.getByRole('heading', { name: 'Create category' })
  await expect(sheetTitle).toBeVisible()
  await expect(sheet).toHaveCSS('overflow-x', 'hidden')

  const titleBounds = await sheetTitle.boundingBox()
  if (!titleBounds) {
    throw new Error('Expected the category sheet title to be visible.')
  }

  await page.mouse.move(
    titleBounds.x + titleBounds.width - 8,
    titleBounds.y + titleBounds.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(titleBounds.x + 8, titleBounds.y + titleBounds.height / 2)
  await page.mouse.up()

  await expect(sheetTitle).toBeVisible()
  await expect.poll(() => sheet.evaluate((node) => node.scrollLeft)).toBe(0)

  await palette.evaluate((node) => {
    node.scrollLeft = node.scrollWidth
  })
  const sheetScrollTop = await sheet.evaluate((node) => node.scrollTop)
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

  await sheet.getByRole('button', { name: 'Graphite' }).click()

  await expect(sheet.getByRole('button', { name: 'Graphite' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect.poll(() => sheet.evaluate((node) => node.scrollTop)).toBe(sheetScrollTop)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(viewportWidth)
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
  const chartBars = chart.locator('span[title]')
  await expect(chartBars).toHaveCount(12)
  const monthBarBounds = await chartBars.first().boundingBox()
  if (!monthBarBounds) {
    throw new Error('Expected the first month stats bar to be visible.')
  }

  await detail.getByRole('tab', { name: 'Year' }).click()
  await expect(chartBars).toHaveCount(1)
  const yearBarBounds = await chartBars.first().boundingBox()
  if (!yearBarBounds) {
    throw new Error('Expected the year stats bar to be visible.')
  }

  expect(Math.abs(yearBarBounds.width - monthBarBounds.width)).toBeLessThanOrEqual(1)
})
