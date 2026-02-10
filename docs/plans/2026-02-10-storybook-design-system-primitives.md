# Storybook Design System Foundations and Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up Storybook and a reusable command-center design system layer so Safe screens can be refactored from stable, tested UI primitives and patterns.

**Architecture:** Introduce a local design-system under `apps/web/src/design-system/**` with strict tokenization (`--ds-*`), colocated stories, and fixture-driven pattern/domain stories. Keep business logic inside existing `/safe/**` containers and progressively swap view components.

**Tech Stack:** React, TypeScript, Storybook (`@storybook/react-vite`), Tailwind v4, Vitest, Playwright/agent-browser for manual visual validation

---

**Relevant skills:** @writing-plans, @agent-browser

### Task 1: Install and Bootstrap Storybook

**Files:**
- Modify: `apps/web/package.json`
- Create/Modify: Storybook config files under `apps/web/.storybook/`

**Step 1: Initialize Storybook**

Run: `cd apps/web && bunx storybook@latest init --builder @storybook/builder-vite --type react`
Expected: `.storybook` config and scripts generated.

**Step 2: Normalize scripts and config**

Ensure `apps/web/package.json` contains:
- `storybook`
- `build-storybook`

Ensure Vite + Tailwind integration works for stories.

**Step 3: Run Storybook smoke test**

Run: `cd apps/web && bun run storybook --ci --smoke-test`
Expected: exits successfully.

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/.storybook
git commit -m "chore(storybook): bootstrap storybook for web app"
```

### Task 2: Add Design-System Foundation Tokens

**Files:**
- Create: `apps/web/src/design-system/foundations/tokens.css`
- Create: `apps/web/src/design-system/foundations/typography.css`
- Modify: `apps/web/src/styles.css` (or global import path)
- Create: `apps/web/src/design-system/foundations/Tokens.stories.tsx`

**Step 1: Define semantic token contract**

Create `--ds-*` groups:
- `--ds-color-*`
- `--ds-space-*`
- `--ds-radius-*`
- `--ds-border-*`
- `--ds-shadow-*`
- `--ds-font-*`, `--ds-type-*`

**Step 2: Wire global import**

Import foundation css into app + Storybook preview so both render identically.

**Step 3: Add token visualization story**

Create story showing swatches, spacing ladder, typography scale.

**Step 4: Validate**

Run:
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run test`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/design-system/foundations apps/web/src/styles.css
git commit -m "feat(design-system): add command-center foundation tokens"
```

### Task 3: Implement Core Primitives

**Files:**
- Create: `apps/web/src/design-system/primitives/Button.tsx`
- Create: `apps/web/src/design-system/primitives/Card.tsx`
- Create: `apps/web/src/design-system/primitives/Input.tsx`
- Create: `apps/web/src/design-system/primitives/Badge.tsx`
- Create: colocated stories `*.stories.tsx`
- Create: `apps/web/src/design-system/primitives/primitives.test.tsx`

**Step 1: Write failing primitive tests**

Cover:
- button variants + disabled state.
- input focus/error state class behavior.
- card/badge semantic rendering.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/design-system/primitives/primitives.test.tsx`
Expected: FAIL.

**Step 3: Implement primitives with token-only styling**

No hardcoded component-local hex values; use `--ds-*` tokens.

**Step 4: Add state-matrix stories**

For each primitive include default/hover/focus/disabled/error/loading where relevant.

**Step 5: Re-run tests + Storybook smoke**

Run:
- `cd apps/web && bun run vitest run src/design-system/primitives/primitives.test.tsx`
- `cd apps/web && bun run storybook --ci --smoke-test`
Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/src/design-system/primitives
git commit -m "feat(design-system): add base primitives and stories"
```

### Task 4: Implement Reusable Command-Center Patterns

**Files:**
- Create: `apps/web/src/design-system/patterns/SidebarNav.tsx`
- Create: `apps/web/src/design-system/patterns/StatGrid.tsx`
- Create: `apps/web/src/design-system/patterns/ActivityFeed.tsx`
- Create: `apps/web/src/design-system/fixtures/command-center.ts`
- Create: pattern stories

**Step 1: Build fixture data first**

Create deterministic fixtures for nav items, stat cards, activity entries.

**Step 2: Implement pattern components from primitives**

No direct business logic, only presentational composition.

**Step 3: Add desktop/mobile stories**

Include viewport variants per pattern.

**Step 4: Validate**

Run:
- `cd apps/web && bun run storybook --ci --smoke-test`
- `bun run check`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/design-system/patterns apps/web/src/design-system/fixtures
git commit -m "feat(design-system): add command-center layout patterns"
```

### Task 5: Add Safe Domain Presentational Components

**Files:**
- Create: `apps/web/src/design-system/domains/safe/GuardStatusBanner.tsx`
- Create: `apps/web/src/design-system/domains/safe/DelegateCard.tsx`
- Create: `apps/web/src/design-system/domains/safe/PendingTxRow.tsx`
- Create: domain stories with realistic fixtures

**Step 1: Extract UI-only domain components**

Keep hooks/network calls in existing `apps/web/src/safe/**` containers.

**Step 2: Add realistic scenario stories**

Include:
- guard enabled/disabled
- threshold variants (1-of-1, 2-of-3)
- pending/ready/executed transaction row states

**Step 3: Validate**

Run:
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run test`
Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/src/design-system/domains/safe
git commit -m "feat(design-system): add safe domain presentational components"
```

### Task 6: Build Composition Stories and First Route Integration

**Files:**
- Create: `apps/web/src/design-system/compositions/command-center/CommandCenterOverview.tsx`
- Create: composition stories
- Modify: first integration target (likely `apps/web/src/safe/transactions/DashboardView.tsx`)

**Step 1: Build composition from patterns + domain components**

Create one full overview composition first.

**Step 2: Add composition story and manual validation checklist doc**

Create note file:
- `docs/plans/2026-02-10-command-center-validation-notes.md`

Include pass/fail checklist for spacing, typography, states, mobile.

**Step 3: Integrate composition into one route section behind existing logic**

Swap UI rendering only; keep behavior unchanged.

**Step 4: Validate manually with @agent-browser**

- compare with `mockups/layout-1-command-center.html`.
- take desktop + mobile screenshots.

**Step 5: Commit**

```bash
git add apps/web/src/design-system/compositions/command-center apps/web/src/safe/transactions/DashboardView.tsx docs/plans/2026-02-10-command-center-validation-notes.md
git commit -m "feat(ui): integrate first command-center composition into safe dashboard"
```

### Task 7: Final Gate

**Files:**
- Validate only

**Step 1: Run full validation**

Run:
- `bun run check`
- `bun run test`
- `cd apps/web && bun run build-storybook`

Expected: PASS.

**Step 2: Document residual gaps**

Write open items in a short section at bottom of this plan file.

**Step 3: Commit final polish (if needed)**

```bash
git add <touched files>
git commit -m "chore(ui): finalize storybook design-system foundation milestone"
```
