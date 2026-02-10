import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type APIRequestContext } from '@playwright/test'

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts', 'prd3')

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const storyGroups = [
  { name: 'foundations', patterns: [/^design-system-foundations-/i] },
  { name: 'primitives', patterns: [/^design-system-primitives-/i] },
  { name: 'patterns', patterns: [/^design-system-patterns-/i] },
  { name: 'domains-safe', patterns: [/^design-system-domains-safe-/i] },
  { name: 'compositions', patterns: [/^design-system-compositions-command-center-/i] },
  // Bootstrap fallback before PRD3 groups exist.
  { name: 'bootstrap', patterns: [/^stories-/i, /^example-/i] },
] as const

interface StoryIndexEntry {
  id: string
  type: string
}

interface StoryIndexPayload {
  entries: Record<string, StoryIndexEntry>
}

function ensureArtifactsDir() {
  mkdirSync(artifactsDir, { recursive: true })
}

function toFileSlug(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/--+/g, '-').toLowerCase()
}

async function loadStoryIds(request: APIRequestContext): Promise<string[]> {
  const response = await request.get('/index.json')
  expect(response.ok()).toBeTruthy()

  const payload = await response.json() as StoryIndexPayload
  return Object.values(payload.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id)
}

async function captureStory(page: Page, storyId: string, groupName: string) {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`)
    await expect(page.locator('#storybook-root')).toBeVisible()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(artifactsDir, `${groupName}-${toFileSlug(storyId)}-${viewport.name}.png`),
      fullPage: true,
    })
  }
}

test('storybook visual matrix for design-system and bootstrap stories', async ({ page, request }) => {
  ensureArtifactsDir()

  const allStoryIds = await loadStoryIds(request)
  expect(allStoryIds.length).toBeGreaterThan(0)

  let capturedCount = 0
  for (const group of storyGroups) {
    const matching = allStoryIds.filter((storyId) =>
      group.patterns.some((pattern) => pattern.test(storyId)),
    )

    for (const storyId of matching.slice(0, 3)) {
      await captureStory(page, storyId, group.name)
      capturedCount += 1
    }
  }

  if (capturedCount === 0 && allStoryIds.length > 0) {
    await captureStory(page, allStoryIds[0], 'misc')
    capturedCount += 1
  }

  expect(capturedCount).toBeGreaterThan(0)
})
