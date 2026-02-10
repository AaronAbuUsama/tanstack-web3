import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type APIRequestContext } from '@playwright/test'

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts', 'prd3')

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const storyGroups = [
  {
    name: 'foundations',
    label: 'Foundations Tokens',
    maxStories: 6,
    patterns: [/^design-system-foundations-/i],
  },
  {
    name: 'shells',
    label: 'Shells',
    maxStories: 12,
    patterns: [/^design-system-shells-/i],
  },
  {
    name: 'primitives',
    label: 'Primitives',
    maxStories: 12,
    patterns: [/^design-system-primitives-/i],
  },
  { name: 'patterns', label: 'Patterns', maxStories: 12, patterns: [/^design-system-patterns-/i] },
  {
    name: 'domains-safe',
    label: 'Domain Safe',
    maxStories: 12,
    patterns: [/^design-system-domains-safe-/i, /^design-system-domains\/safe-/i],
  },
  {
    name: 'compositions',
    label: 'Compositions CommandCenter Screens',
    maxStories: 20,
    patterns: [/^design-system-compositions-command-center-/i],
  },
  // Bootstrap fallback before PRD3 groups exist.
  { name: 'bootstrap', label: 'Bootstrap', maxStories: 3, patterns: [/^stories-/i, /^example-/i] },
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

for (const group of storyGroups) {
  test(`storybook visual matrix: ${group.label}`, async ({ page, request }) => {
    ensureArtifactsDir()

    const allStoryIds = await loadStoryIds(request)
    expect(allStoryIds.length).toBeGreaterThan(0)

    const matching = allStoryIds.filter((storyId) =>
      group.patterns.some((pattern) => pattern.test(storyId)),
    )

    test.skip(matching.length === 0, `No stories found for ${group.label}`)

    let capturedCount = 0
    for (const storyId of matching.slice(0, group.maxStories)) {
      await captureStory(page, storyId, group.name)
      capturedCount += 1
    }

    expect(capturedCount).toBeGreaterThan(0)
  })
}
