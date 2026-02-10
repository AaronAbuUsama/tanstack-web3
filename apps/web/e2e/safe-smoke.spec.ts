import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts')

const ACCOUNT_ZERO = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const ACCOUNT_ONE = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

function getWalletBar(page: Page): Locator {
  return page.getByRole('button', { name: 'Disconnect' }).locator('xpath=..')
}

function getCreateSafePanel(page: Page): Locator {
  return page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: 'Create New Safe' }),
  }).first()
}

async function takeArtifact(page: Page, fileName: string) {
  mkdirSync(artifactsDir, { recursive: true })
  await page.screenshot({
    path: path.join(artifactsDir, fileName),
    fullPage: true,
  })
}

test('safe smoke: connect, switch dev account, setup flow, pending status correctness', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())

  await page.goto('/safe')
  await expect(page.getByRole('heading', { name: 'Safe Dashboard' })).toBeVisible()

  const disconnectButton = page.getByRole('button', { name: 'Disconnect' })
  if ((await disconnectButton.count()) === 0) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await page.getByRole('button', { name: 'Dev Wallet' }).first().click({ timeout: 10_000 })
        break
      } catch (error) {
        if (attempt === 4) throw error
        await page.waitForTimeout(250)
      }
    }
  }

  const walletBar = getWalletBar(page)
  const addressText = walletBar.locator('span.font-mono').first()

  await expect.poll(async () => (await addressText.textContent()) ?? '').toMatch(/0xf39f/i)

  const devAccountSelect = page.getByLabel('Dev Account')
  await expect(devAccountSelect).toBeVisible()

  await takeArtifact(page, '01-safe-connected-dev-account-0.png')

  const beforeSwitch = await addressText.textContent()
  await devAccountSelect.selectOption('1')
  await expect.poll(async () => (await addressText.textContent()) ?? '').toMatch(/0x7099/i)
  const afterSwitch = await addressText.textContent()
  expect(afterSwitch).not.toBe(beforeSwitch)

  await takeArtifact(page, '02-safe-switched-dev-account-1.png')

  const chainSelect = walletBar.locator('select').nth(1)
  await expect(chainSelect).toBeVisible()
  await chainSelect.selectOption('10200')
  await expect(chainSelect).toHaveValue('10200')

  const createSafePanel = getCreateSafePanel(page)
  await expect(createSafePanel).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Connect to Existing Safe' })).toBeVisible()

  await takeArtifact(page, '03-safe-setup-view.png')

  const ownerInputs = createSafePanel.locator('input[placeholder="0x..."]')
  await ownerInputs.first().fill(ACCOUNT_ONE)
  await createSafePanel.getByRole('button', { name: '+ Add Owner' }).click()
  await expect(ownerInputs).toHaveCount(2)
  await ownerInputs.nth(1).fill(ACCOUNT_ZERO)

  await createSafePanel.locator('button', { hasText: /^2$/ }).click()
  await createSafePanel.getByRole('button', { name: 'Deploy Safe' }).click()

  await expect(page.getByText('Safe Address')).toBeVisible({ timeout: 120_000 })
  await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()
  await expect(page.getByText(/Local-only:/)).toBeVisible()

  await takeArtifact(page, '04-safe-deployed-dashboard.png')

  const txBuilder = page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: 'Transaction Builder' }),
  }).first()

  await txBuilder.locator('input[placeholder="0x..."]').fill(ACCOUNT_ZERO)
  await txBuilder.locator('input[placeholder="0.0"]').fill('0')
  await txBuilder.getByRole('button', { name: 'Build Transaction' }).click()

  await expect(page.getByRole('heading', { name: /Pending Transactions/ })).toBeVisible()
  await takeArtifact(page, '05-safe-pending-created.png')

  await page.getByRole('button', { name: 'Confirm' }).first().click()

  const pendingPanel = page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: /Pending Transactions/ }),
  }).first()

  await expect(pendingPanel.getByText('Pending', { exact: true }).first()).toBeVisible()
  await expect(pendingPanel.getByText(/1\s*\/\s*2/).first()).toBeVisible()
  await expect(pendingPanel.getByText('Ready', { exact: true })).toHaveCount(0)
  await expect(pendingPanel.getByRole('button', { name: 'Execute' })).toHaveCount(0)

  await takeArtifact(page, '06-safe-pending-not-ready-before-threshold.png')
})
