import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts', 'prd2')

const ACCOUNT_ZERO = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const ACCOUNT_ONE = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

function getWalletBar(page: Page): Locator {
  return page.getByRole('button', { name: 'Disconnect' }).locator('xpath=..')
}

async function takeArtifact(page: Page, fileName: string) {
  mkdirSync(artifactsDir, { recursive: true })
  await page.screenshot({
    path: path.join(artifactsDir, fileName),
    fullPage: true,
  })
}

async function connectDevWallet(page: Page, accountIndex: number) {
  await page.goto('/safe')
  await expect(page.getByRole('heading', { name: 'Safe Dashboard' })).toBeVisible()

  await page.getByRole('button', { name: 'Dev Wallet' }).first().click()

  const walletBar = getWalletBar(page)
  const chainSelect = walletBar.locator('select').nth(1)
  await expect(chainSelect).toBeVisible()
  await chainSelect.selectOption('10200')
  await expect(chainSelect).toHaveValue('10200')

  const devAccountSelect = page.getByLabel('Dev Account')
  await expect(devAccountSelect).toBeVisible()
  await devAccountSelect.selectOption(String(accountIndex))

  const addressText = walletBar.locator('span.font-mono').first()
  if (accountIndex === 0) {
    await expect.poll(async () => (await addressText.textContent()) ?? '').toMatch(/0xf39f/i)
  } else {
    await expect.poll(async () => (await addressText.textContent()) ?? '').toMatch(/0x7099/i)
  }
}

async function deployTwoOwnerSafe(page: Page): Promise<string> {
  const createSafePanel = page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: 'Create New Safe' }),
  }).first()

  const ownerInputs = createSafePanel.locator('input[placeholder="0x..."]')
  await ownerInputs.first().fill(ACCOUNT_ZERO)
  await createSafePanel.getByRole('button', { name: '+ Add Owner' }).click()
  await expect(ownerInputs).toHaveCount(2)
  await ownerInputs.nth(1).fill(ACCOUNT_ONE)

  await createSafePanel.getByRole('button', { name: '2' }).click()
  await createSafePanel.getByRole('button', { name: 'Deploy Safe' }).click()

  await expect(page.getByText('Safe Address')).toBeVisible({ timeout: 120_000 })
  const safeAddress = await page.locator('code').first().textContent()
  if (!safeAddress) throw new Error('Safe address not found after deployment')
  return safeAddress.trim()
}

async function connectExistingSafe(page: Page, safeAddress: string) {
  await expect(page.getByRole('heading', { name: 'Connect to Existing Safe' })).toBeVisible()
  const connectPanel = page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: 'Connect to Existing Safe' }),
  }).first()
  await connectPanel.locator('input[placeholder="0x..."]').fill(safeAddress)
  await connectPanel.getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByText('Safe Address')).toBeVisible({ timeout: 60_000 })
}

async function createCleanContext(baseContext?: BrowserContext) {
  if (!baseContext) {
    return { context: null, page: null }
  }

  const page = await baseContext.newPage()
  await page.goto('/safe')
  await page.evaluate(() => window.localStorage.clear())
  await page.close()
  return { context: baseContext, page: null }
}

test('safe multisig: two signers can coordinate and execute in deterministic local fallback mode', async ({ browser }) => {
  const contextA = await browser.newContext()
  await createCleanContext(contextA)
  const pageA = await contextA.newPage()

  await connectDevWallet(pageA, 0)
  const safeAddress = await deployTwoOwnerSafe(pageA)

  const txBuilder = pageA.locator('div.bg-gray-800').filter({
    has: pageA.getByRole('heading', { name: 'Transaction Builder' }),
  }).first()
  await txBuilder.locator('input[placeholder="0x..."]').fill(ACCOUNT_ONE)
  await txBuilder.locator('input[placeholder="0.0"]').fill('0')
  await txBuilder.getByRole('button', { name: 'Build Transaction' }).click()

  await expect(pageA.getByRole('heading', { name: /Pending Transactions/ })).toBeVisible()
  await takeArtifact(pageA, '01-owner-a-proposed-tx.png')

  const storageState = await contextA.storageState()
  const contextB = await browser.newContext({ storageState })
  const pageB = await contextB.newPage()

  await connectDevWallet(pageB, 1)
  await connectExistingSafe(pageB, safeAddress)

  const pendingPanelB = pageB.locator('div.bg-gray-800').filter({
    has: pageB.getByRole('heading', { name: /Pending Transactions/ }),
  }).first()
  await expect(pendingPanelB.getByText('Pending', { exact: true }).first()).toBeVisible()
  await takeArtifact(pageB, '02-owner-b-sees-pending.png')

  await pendingPanelB.getByRole('button', { name: 'Confirm' }).first().click()
  await expect(pendingPanelB.getByText(/1\s*\/\s*2/).first()).toBeVisible()
  await takeArtifact(pageB, '03-owner-b-confirmed.png')

  await pageA.reload()
  await connectDevWallet(pageA, 0)
  await connectExistingSafe(pageA, safeAddress)

  const pendingPanelA = pageA.locator('div.bg-gray-800').filter({
    has: pageA.getByRole('heading', { name: /Pending Transactions/ }),
  }).first()
  await expect(pendingPanelA.getByText(/1\s*\/\s*2/).first()).toBeVisible({ timeout: 30_000 })
  await takeArtifact(pageA, '04-owner-a-sees-updated-confirmations.png')

  await pendingPanelA.getByRole('button', { name: 'Confirm' }).first().click()
  await expect(pendingPanelA.getByText('Ready', { exact: true }).first()).toBeVisible()
  await pendingPanelA.getByRole('button', { name: 'Execute' }).first().click()

  await expect(pageA.getByRole('heading', { name: /Transaction History/ })).toBeVisible()
  await expect(pageA.getByText('Executed', { exact: true }).first()).toBeVisible()
  await takeArtifact(pageA, '05-owner-a-executed-transaction.png')

  await contextB.close()
  await contextA.close()
})
