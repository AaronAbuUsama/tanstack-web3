# Storybook Design System Foundations and Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up Storybook and a reusable command-center design system layer so Safe screens can be refactored from stable, tested UI primitives and patterns.

**Architecture:** Introduce a local design-system under `apps/web/src/design-system/**` with strict tokenization (`--ds-*`), colocated stories, and fixture-driven pattern/domain stories. Keep business logic inside existing `/safe/**` containers and progressively swap view components.

**Tech Stack:** React, TypeScript, Storybook (`@storybook/react-vite`), Tailwind v4, Vitest, Playwright/agent-browser for manual visual validation

---

**Relevant skills:** @writing-plans, @agent-browser

## Validation Contract (Mandatory For Every Task)

Every UI task must include proof from both automated and visual validation.

1. **Automated validation**
- Storybook smoke/build checks for changed stories.
- Relevant unit/component tests.

2. **Visual browser validation (non-unit)**
- Run scripted visual validation first (`cd apps/web && bun run e2e:storybook-visual`).
- Validate changed stories at desktop + mobile viewport.
- Compare against mockup reference files where applicable.
- Capture screenshots for each changed component/pattern/composition under `apps/web/e2e/artifacts/prd3/`.

3. **Regression validation**
- Confirm the integrated route still works after component swap.
- Verify interactive states (`hover`, `focus`, `disabled`, `loading`) manually.

Hard rule: passing tests are not enough; visual acceptance evidence is required.

## Artifact Policy (Locked)

- Store PRD3 screenshots under `apps/web/e2e/artifacts/prd3/`.
- Keep generated runtime artifacts out of git using `apps/web/e2e/artifacts/.gitignore`.
- For every validation run, record command + pass/fail + screenshot list in `Validation Evidence` at the bottom of this plan.
- If a validation command fails, do not proceed; fix and rerun until green (or explicitly document a blocker).

### Task 0: Add Scripted Storybook Visual Validation Harness

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/storybook-visual.spec.ts`
- Modify: `apps/web/e2e/README.md`
- Modify: `apps/web/e2e/artifacts/.gitignore`

**Step 1: Add deterministic visual test command**

Add `e2e:storybook-visual` that:
- starts Storybook on a fixed local port.
- runs Playwright visual assertions for selected stories.
- writes screenshots to `apps/web/e2e/artifacts/prd3/`.

**Step 2: Implement viewport matrix assertions**

Script must validate at minimum:
- desktop viewport
- mobile viewport

for changed story groups (foundations, primitives, patterns, domain components, compositions).

**Step 3: Run focused visual script**

Run: `cd apps/web && bun run e2e:storybook-visual`
Expected: FAIL first, then PASS after implementation.

**Step 4: Verify artifact output**

Run: `ls -la apps/web/e2e/artifacts/prd3`
Expected: screenshot files present for desktop and mobile story checks.

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/playwright.config.ts apps/web/e2e/storybook-visual.spec.ts apps/web/e2e/README.md apps/web/e2e/artifacts/.gitignore
git commit -m "test(e2e): add scripted storybook visual validation harness"
```

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

**Step 4: Run scripted visual gate**

Run: `cd apps/web && bun run e2e:storybook-visual`
Expected: PASS with screenshot artifacts for bootstrap stories.

**Step 5: Commit**

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
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Tokens"`
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
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Primitive"`
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
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Pattern"`
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
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Domain"`
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

**Step 4: Validate scripted + manual spot-check**

- Run: `cd apps/web && bun run e2e:storybook-visual -- --grep "Composition|CommandCenterOverview"`
- Compare with `mockups/layout-1-command-center.html`.
- If visual mismatch remains ambiguous, perform `@agent-browser` spot-check and capture supplemental screenshots.

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
- `cd apps/web && bun run e2e:storybook-visual`

Expected: PASS.

**Step 2: Document residual gaps**

Write open items in a short section at bottom of this plan file.

Also include `Validation Evidence` with screenshot paths and pass/fail notes for each milestone gate (A-E).

If `bun run check` fails due pre-existing repository debt, also run:

- `cd apps/web && bunx biome check <changed-files>`

and record delta status in `Validation Evidence`.

**Step 3: Commit final polish (if needed)**

```bash
git add <touched files>
git commit -m "chore(ui): finalize storybook design-system foundation milestone"
```

## Validation Evidence

Date: YYYY-MM-DD

### Automated validation

- `cd apps/web && bun run vitest run <focused-tests>`
  - PASS/FAIL:
- `cd apps/web && bun run storybook --ci --smoke-test`
  - PASS/FAIL:
- `cd apps/web && bun run build-storybook`
  - PASS/FAIL:
- `bun run test`
  - PASS/FAIL:
- `bun run check`
  - PASS/FAIL:
  - Notes:
- `cd apps/web && bunx biome check <changed-files>` (when needed)
  - PASS/FAIL:

### Visual browser validation

- `cd apps/web && bun run e2e:storybook-visual`
  - PASS/FAIL:
  - Artifacts:
    - `apps/web/e2e/artifacts/prd3/<file>.png`

### Regression sweep

- Desktop/mobile story consistency: PASS/FAIL
- Interactive states (`hover`, `focus`, `disabled`, `loading`): PASS/FAIL
- Integrated `/safe` route behavior after composition swap: PASS/FAIL
