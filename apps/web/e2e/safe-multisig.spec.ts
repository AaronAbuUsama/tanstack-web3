import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts', 'prd2')

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

async function setScreenSearch(page: Page, screen: string | null) {
  await page.evaluate((nextScreen) => {
    const url = new URL(window.location.href)
    if (nextScreen) {
      url.searchParams.set('screen', nextScreen)
    } else {
      url.searchParams.delete('screen')
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, screen)
  await page.waitForTimeout(150)
}

async function connectDevWallet(page: Page, accountIndex: number) {
  await page.goto('/safe')
  await expect(page.getByRole('heading', { name: 'Safe Dashboard' })).toBeVisible()

  const disconnectButton = page.getByRole('button', { name: 'Disconnect' })
  const devWalletButton = page.getByRole('button', { name: 'Dev Wallet' }).first()
  await expect.poll(
    async () => (await disconnectButton.count()) > 0 || (await devWalletButton.count()) > 0,
    { timeout: 60_000 },
  ).toBe(true)

  if ((await disconnectButton.count()) === 0) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await devWalletButton.click({ timeout: 10_000 })
        break
      } catch (error) {
        if (attempt === 4) throw error
        await page.waitForTimeout(250)
      }
    }
  }

  await expect(disconnectButton).toBeVisible()

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

async function readSafeAddress(page: Page): Promise<string> {
  let safeAddress = ''
  await expect
    .poll(
      async () => {
        safeAddress = await page.evaluate((knownAccounts) => {
          const matches = document.body.innerText.match(/0x[a-fA-F0-9]{40}/g) ?? []
          const known = new Set(knownAccounts.map((address) => address.toLowerCase()))
          return matches.find((candidate) => !known.has(candidate.toLowerCase())) ?? ''
        }, [ACCOUNT_ZERO, ACCOUNT_ONE])
        return safeAddress
      },
      { timeout: 60_000 },
    )
    .toMatch(/^0x[a-fA-F0-9]{40}$/)

  return safeAddress
}

async function deployTwoOwnerSafe(page: Page): Promise<string> {
  const createSafePanel = getCreateSafePanel(page)

  const ownerInputs = createSafePanel.locator('input[placeholder="0x..."]')
  await ownerInputs.first().fill(ACCOUNT_ZERO)
  await createSafePanel.getByRole('button', { name: '+ Add Owner' }).click()
  await expect(ownerInputs).toHaveCount(2)
  await ownerInputs.nth(1).fill(ACCOUNT_ONE)

  await createSafePanel.getByRole('button', { name: '2' }).click()
  await createSafePanel.getByRole('button', { name: 'Deploy Safe' }).click()

  await expect(
    page.getByRole('heading', { name: 'Command Center Overview', exact: true }),
  ).toBeVisible({ timeout: 120_000 })

  return readSafeAddress(page)
}

async function connectExistingSafe(page: Page, safeAddress: string) {
  await expect(page.getByRole('heading', { name: 'Connect to Existing Safe' })).toBeVisible()
  const connectPanel = page.locator('div.bg-gray-800').filter({
    has: page.getByRole('heading', { name: 'Connect to Existing Safe' }),
  }).first()
  await connectPanel.locator('input[placeholder="0x..."]').fill(safeAddress)
  await connectPanel.getByRole('button', { name: 'Connect' }).click()
  await expect(
    page.getByRole('heading', { name: 'Command Center Overview', exact: true }),
  ).toBeVisible({ timeout: 60_000 })
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

  await setScreenSearch(pageA, 'transactions')
  await expect(pageA.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()
  await pageA.getByLabel('Recipient Address').fill(ACCOUNT_ONE)
  await pageA.getByLabel('Value (ETH)').fill('0')
  await pageA.getByRole('button', { name: 'Build Transaction' }).click()

  await expect(pageA.getByText('Pending Signatures')).toBeVisible()
  await expect(pageA.getByRole('button', { name: 'Sign' }).first()).toBeVisible()
  await takeArtifact(pageA, '01-owner-a-proposed-tx.png')

  const storageState = await contextA.storageState()
  const contextB = await browser.newContext({ storageState })
  const pageB = await contextB.newPage()

  await connectDevWallet(pageB, 1)
  await connectExistingSafe(pageB, safeAddress)
  await setScreenSearch(pageB, 'transactions')
  await expect(pageB.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()

  const pendingPanelB = pageB.getByRole('button', { name: 'Sign' }).first()
  await expect(pendingPanelB).toBeVisible()
  await takeArtifact(pageB, '02-owner-b-sees-pending.png')

  await pendingPanelB.click()
  await expect(pageB.getByText(/1\/2 confirmed/)).toBeVisible()
  await takeArtifact(pageB, '03-owner-b-confirmed.png')

  await pageA.reload()
  await connectDevWallet(pageA, 0)
  await connectExistingSafe(pageA, safeAddress)
  await setScreenSearch(pageA, 'transactions')
  await expect(pageA.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()

  await expect(pageA.getByText(/1\/2 confirmed/)).toBeVisible({ timeout: 30_000 })
  await takeArtifact(pageA, '04-owner-a-sees-updated-confirmations.png')

  await pageA.getByRole('button', { name: 'Sign' }).first().click()
  const executeButton = pageA.getByRole('button', { name: 'Execute' }).first()
  await expect(executeButton).toBeVisible({ timeout: 60_000 })
  await executeButton.click()

  await expect(pageA.getByText('Transaction executed')).toBeVisible({ timeout: 60_000 })
  await takeArtifact(pageA, '05-owner-a-executed-transaction.png')

  await contextB.close()
  await contextA.close()
})
