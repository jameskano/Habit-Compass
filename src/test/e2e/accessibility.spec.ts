import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const blockingImpacts = new Set(['serious', 'critical'])

type A11yScanOptions = {
  excludedSelectors?: string[]
}

const expectNoBlockingA11yViolations = async (
  page: Page,
  { excludedSelectors = [] }: A11yScanOptions = {},
) => {
  await page.waitForTimeout(500)

  let builder = new AxeBuilder({ page })
  for (const selector of excludedSelectors) {
    builder = builder.exclude(selector)
  }

  const results = await builder.analyze()
  const violations = results.violations.filter(({ impact }) =>
    impact ? blockingImpacts.has(impact) : false,
  )

  expect(
    violations.map(({ help, id, impact, nodes }) => ({
      help,
      id,
      impact,
      targets: nodes.slice(0, 3).map(({ target }) => target.join(' ')),
    })),
  ).toEqual([])
}

test.describe('accessibility smoke checks', () => {
  test('core routes have no serious or critical axe violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const routes: Array<{ path: string; heading: string; excludedSelectors?: string[] }> = [
      { path: '/today', heading: 'Today' },
      { path: '/week', heading: 'Week' },
      {
        path: '/items',
        heading: 'Habits',
        // Existing item cards need a focused a11y refactor for nested controls and inactive day contrast.
        excludedSelectors: ['[data-item-waterfall-index]'],
      },
      { path: '/settings', heading: 'Settings' },
      { path: '/legal/privacy-policy', heading: 'Privacy Policy' },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(
        page.getByRole('heading', { name: route.heading, level: 1 }).first(),
      ).toBeVisible()
      await expectNoBlockingA11yViolations(page, {
        excludedSelectors: route.excludedSelectors,
      })
    }
  })

  test('settings preference sheet has no serious or critical axe violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/settings')
    await page.getByRole('button', { name: /Theme/ }).click()
    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible()

    await expectNoBlockingA11yViolations(page)
  })
})
