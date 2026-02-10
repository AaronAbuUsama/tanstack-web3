# Storybook Command-Center Reference-First Plan (Revised)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Revision Date:** 2026-02-10

## Why This Was Revised

The previous sequencing allowed generic token/primitives work before reference decomposition. That produced a visual system that did not match the intended command-center direction.

This plan is now locked to a reference-first workflow so implementation fidelity drives token/primitives decisions, not the other way around.

## Goal

Build a production-ready Storybook-backed UI system for Safe flows that faithfully matches the command-center reference style and can be safely integrated into the existing `/safe` screens.

## Canonical Reference (Locked)

Primary visual source:
- `mockups/layout-1-command-center.html`

Secondary references (only when explicitly needed for later variants):
- `mockups/layout-2-card-stack.html`
- `mockups/layout-3-split-workspace.html`

Hard rule:
- No component styling decisions may be introduced without traceability to the primary reference file.

## Architecture (Revised)

Design-system remains under `apps/web/src/design-system/**`, but sequence is:

1. Extract reference language (palette, borders, shadows, spacing, typography, layout rhythm)
2. Implement reference-aligned shells (status bar, sidebar, card shells, nav item shell)
3. Derive reusable primitives from those shells
4. Build patterns and domain components from the proven shells/primitives
5. Integrate into `/safe` route behind existing logic

## Validation Contract (Mandatory For Every Task)

No task is complete without all three categories.

1. **Automated validation**
- Storybook smoke/build checks for changed stories.
- Relevant unit/component tests.

2. **Visual browser validation (non-unit)**
- Run scripted visual validation first: `cd apps/web && bun run e2e:storybook-visual`
- Validate changed stories on desktop and mobile viewport.
- Capture screenshots under `apps/web/e2e/artifacts/prd3/`.
- Each changed story must have an explicit reference note: what section of `mockups/layout-1-command-center.html` it maps to.

3. **Regression validation**
- Confirm `/safe` route behavior remains unchanged after UI swaps.
- Verify interactive states (`hover`, `focus`, `disabled`, `loading`) are represented and visually acceptable.

Hard rule: unit tests alone are insufficient for sign-off.

## Artifact Policy (Locked)

- Store PRD3 screenshots under `apps/web/e2e/artifacts/prd3/`.
- Keep runtime artifacts out of git via `apps/web/e2e/artifacts/.gitignore`.
- Record command + pass/fail + screenshot list in `Validation Evidence`.
- If a validation command fails, stop and fix before moving to the next task.

## Task Plan

### Task 0: Keep Storybook Harness Baseline (Already Complete)

Status:
- Complete (kept)

Kept commits:
- `359acbf` `chore(storybook): bootstrap and add scripted visual harness`
- `299d46f` `test(e2e): support scoped storybook visual grep runs`
- `20793b7` `test(e2e): expand storybook visual capture coverage`

### Task 1: Remove Off-Reference UI Work (Already Complete)

Status:
- Complete (reverted)

Reverted commits:
- `e7fa2e8` Revert of `b428f0b` (generic primitives)
- `b6afd22` Revert of `fc0ffa7` (generic foundations)

### Task 2: Reference Decomposition and Token Contract

**Files:**
- Create: `apps/web/src/design-system/reference/layout-1-spec.md`
- Create: `apps/web/src/design-system/foundations/reference-tokens.css`
- Create: `apps/web/src/design-system/foundations/ReferenceTokens.stories.tsx`
- Modify: `apps/web/src/styles.css` (import reference tokens only)
- Modify: `apps/web/.storybook/preview.ts` (ensure shared imports)

**Step 1: Decompose layout-1 reference into measurable rules**

Extract and document at minimum:
- color palette from reference CSS vars
- border thickness rules (3px / 4px usage)
- shadow geometry style
- primary typography stacks and weights
- spacing rhythm for bars/cards/sidebar

**Step 2: Encode token contract from reference**

- Token source must mirror reference values; no arbitrary palette additions.
- Allow aliases only when mapped to a concrete reference token.

**Step 3: Add token visualization story with traceability labels**

Story must annotate each token group with reference mapping notes.

**Step 4: Validate**

Run:
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run test`
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Reference Tokens|Tokens"`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/design-system/reference apps/web/src/design-system/foundations apps/web/src/styles.css apps/web/.storybook/preview.ts
git commit -m "feat(design-system): add reference-derived command-center token contract"
```

### Task 3: Reference Shell Components (Not Generic Primitives)

**Files:**
- Create: `apps/web/src/design-system/shells/StatusBarShell.tsx`
- Create: `apps/web/src/design-system/shells/SidebarShell.tsx`
- Create: `apps/web/src/design-system/shells/PanelShell.tsx`
- Create: `apps/web/src/design-system/shells/shells.css`
- Create: shell stories
- Create: `apps/web/src/design-system/shells/shells.test.tsx`

**Step 1: Write failing tests for shell semantics**

Cover:
- status bar exposes chain/wallet regions
- sidebar sections and active nav affordance exist
- panel shell preserves heading/body/action regions

**Step 2: Implement shells with strict reference fidelity**

- Match border thickness, hard shadows, and radii behavior from layout-1.
- Keep classes explicit and traceable to reference sections.

**Step 3: Add state stories**

- desktop and mobile variants
- active/inactive nav
- disconnected/connected status bar modes

**Step 4: Validate**

Run:
- `cd apps/web && bun run vitest run src/design-system/shells/shells.test.tsx`
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Shell|StatusBar|Sidebar|Panel"`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/design-system/shells
git commit -m "feat(design-system): add reference-faithful command-center shell components"
```

### Task 4: Minimal Primitives Derived From Shells

**Files:**
- Create: `apps/web/src/design-system/primitives/Button.tsx`
- Create: `apps/web/src/design-system/primitives/Badge.tsx`
- Create: `apps/web/src/design-system/primitives/Input.tsx`
- Create: `apps/web/src/design-system/primitives/primitives.css`
- Create: stories + tests

Hard constraints:
- Only introduce primitive variants used by layout-1.
- No abstract variant explosion.
- Every primitive story must note where it is used in the layout-1 composition.

**Validation:**
- focused primitive tests
- storybook smoke
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Primitive"`

### Task 5: Command-Center Patterns + Fixtures (Reference Bound)

**Files:**
- Create: `apps/web/src/design-system/fixtures/command-center.ts`
- Create: `apps/web/src/design-system/patterns/SidebarNav.tsx`
- Create: `apps/web/src/design-system/patterns/StatStrip.tsx`
- Create: `apps/web/src/design-system/patterns/ActivityList.tsx`
- Create: pattern stories

Hard constraints:
- Pattern names and structure should map directly to reference sections.
- Fixture values should mirror realistic Safe data while preserving reference layout shape.

**Validation:**
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Pattern"`

### Task 6: Safe Domain Presentational Components

**Files:**
- Create: `apps/web/src/design-system/domains/safe/GuardStatusBanner.tsx`
- Create: `apps/web/src/design-system/domains/safe/OwnerThresholdChip.tsx`
- Create: `apps/web/src/design-system/domains/safe/PendingTxRow.tsx`
- Create: domain stories

Hard constraints:
- Presentational only; no network/hook logic.
- Domain visuals must inherit shell/pattern language from layout-1.

**Validation:**
- storybook smoke
- app tests
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Domain|Safe"`

### Task 7: First Route Integration

**Files:**
- Create: `apps/web/src/design-system/compositions/command-center/CommandCenterOverview.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `docs/plans/2026-02-10-command-center-validation-notes.md`

Hard constraints:
- Keep existing transaction logic untouched.
- Swap rendering only.
- Include explicit before/after screenshot evidence.

**Validation:**
- `cd apps/web && bun run e2e:safe-smoke`
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Composition|CommandCenterOverview"`
- manual comparison against `mockups/layout-1-command-center.html`

### Task 8: Final Gate

Run:
- `bun run test`
- `cd apps/web && bun run test`
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run build-storybook`
- `cd apps/web && bun run e2e:storybook-visual`

If `bun run check` fails due pre-existing repo debt:
- run scoped biome check for changed files and record status.

## Validation Evidence

Date: 2026-02-10

### Rebaseline actions

- Reverted off-reference UI commits:
  - `e7fa2e8` (revert primitives)
  - `b6afd22` (revert foundations)
- Kept Storybook harness commits:
  - `359acbf`
  - `299d46f`
  - `20793b7`

### Automated validation

- `cd apps/web && bun run storybook --ci --smoke-test`
  - PASS
- `cd apps/web && bun run test`
  - PASS (13 files, 58 tests)

### Visual browser validation

- `cd apps/web && bun run e2e:storybook-visual`
  - PASS (bootstrap group executed, non-existent design-system groups skipped by harness)
  - Artifacts:
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-primary-desktop.png`
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-primary-mobile.png`
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-secondary-desktop.png`
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-secondary-mobile.png`
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-large-desktop.png`
    - `apps/web/e2e/artifacts/prd3/bootstrap-example-button-large-mobile.png`

### Regression sweep

- `/safe` route still renders with current baseline: PASS (covered by app test suite and no `/safe` runtime files changed in rebaseline)
- Storybook harness still operational after rebaseline: PASS
