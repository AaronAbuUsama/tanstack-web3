# Neo-Brutal Command Center Storybook Plan

**Goal:** Build a clean, reusable design system and Storybook workflow from the mockups before refactoring product screens.

**Current State (from repo):**

- Command-center mockup exists with clear section structure and reusable UI patterns in `/Users/abuusama/projects/starter-dapp/tanstack-web3/mockups/layout-1-command-center.html`.
- Existing app UI is mostly feature-coupled Tailwind components in `/Users/abuusama/projects/starter-dapp/tanstack-web3/apps/web/src/safe/**` and `/Users/abuusama/projects/starter-dapp/tanstack-web3/apps/web/src/web3/**`.
- Storybook is not configured yet.

---

## 1) What We Are Designing

Primary visual direction: **neo-brutalism + command-center layout**.

Primary functional sections in mockup:

- Shell: top status bar + sidebar + main canvas.
- Overview: stat cards, quick actions, activity feed.
- Guard: status banner, limit display, settings form.
- Module: delegate cards, allowance form, execute panel.
- Transactions: builder form, pending queue, history.
- Owners: threshold selector, owner list/rows.

These sections map cleanly to composable components and Storybook compositions.

---

## 2) Architecture Decision (Locked)

Use **Hybrid Domain + UI Layers**.

**Shape**

- `foundations`: tokens, typography, spacing, shadows, radii.
- `primitives`: generic reusable UI (Button, Input, Card, Badge, Tabs).
- `patterns`: reusable command-center patterns (SidebarNav, StatGrid, ActivityFeed, ThresholdControl, AddressPill).
- `domains/safe`: Safe-specific presentational components (GuardStatusBanner, DelegateCard, PendingTxRow, OwnersList).
- `features`: logic containers/hooks that wire domain components to data.

**Why this is locked**

- Keeps design system clean without forcing everything into atom/molecule debates.
- Fits current codebase where business logic is currently mixed into UI.
- Easier migration path: extract presentational layer first, then rewire containers.

---

Rules:

- If it is brand/style-level and generic -> `foundations` or `primitives`.
- If it is repeated layout behavior -> `patterns`.
- If it is Safe-specific but UI-only -> `domains/safe`.
- If it fetches/executes business logic -> `features` container.

---

## 3) Storybook Information Architecture

Proposed top-level Storybook groups:

- `Foundations`
- `Primitives`
- `Patterns`
- `Domain/Safe`
- `Compositions/Command Center`
- `Playground` (theme + density + states)

Story depth strategy:

- `Foundations`: token docs, typography scale, spacing/shadows/radii.
- `Primitives`: component stories with states (`default`, `hover`, `focus`, `disabled`, `danger`, `loading`).
- `Patterns`: composed UI with fixture data.
- `Domain/Safe`: realistic scenarios (guard active/inactive, 1-of-1 vs 2-of-3, module enabled/disabled).
- `Compositions`: full command-center shell and each section as “screen stories”.

---

## 4) Component Inventory for Initial Extraction

From `/Users/abuusama/projects/starter-dapp/tanstack-web3/mockups/layout-1-command-center.html`:

- `AppShell`
- `TopStatusBar`
- `Sidebar`
- `SidebarNav`
- `SidebarNavItem`
- `PageTitle`
- `Card`
- `StatCard`
- `QuickActionButton`
- `ActivityFeed` + `ActivityItem`
- `StatusBanner`
- `LimitMeter`
- `DelegateCard`
- `TransactionForm`
- `PendingTxRow`
- `ThresholdControl`
- `OwnerRow`
- `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Tabs`, `AddressText`, `StatusDot`

Important: add theme tokens before extracting these components, otherwise visual consistency will drift.

---

## 5) Implementation Plan (Phased, No Random Component Building)

### Phase 0: Audit + Contract

- Freeze component API contract from mockup sections.
- Capture naming conventions and prop standards.
- Define “UI-only vs logic container” boundaries.
- Define milestone-level manual acceptance checklist before coding.

### Phase 1: Foundations First

- Introduce neo-brutalist token system (colors, borders, shadows, radii, type scale, spacing) in CSS variables.
- Add theme contract for command-center variant (and optional future style variants).

### Phase 2: Storybook Setup

- Add Storybook (`@storybook/react-vite`) scoped to `apps/web`.
- Configure Vite/Tailwind integration and path aliases.
- Add addons: docs, controls, a11y, interactions.
- Add a reference-check workflow in Storybook so each story can be manually validated against mockup sections.

### Phase 3: Primitives

- Build primitives with stable APIs and complete state coverage.
- Add strict stories for each primitive state matrix.

### Phase 4: Patterns

- Implement command-center reusable patterns with fixture data.
- Write stories that validate layout behavior at desktop/mobile breakpoints.

### Phase 5: Domain/Safe Presentational Components

- Extract UI-only components from existing feature files.
- Keep async/web3 logic in containers/hooks.
- Add realistic domain stories from fixtures.

### Phase 6: Compositions + Route Integration

- Build `CommandCenterOverview`, `CommandCenterTransactions`, `CommandCenterOwners`, etc. as composition stories first.
- Then integrate compositions into `/safe` route behind the existing business logic.

### Phase 7: Quality Gates

- Enforce manual visual verification on every milestone before moving forward.
- Add interaction tests for critical flows (button states, form validation UI, tab switching, queue states).
- Require written pass/fail notes per milestone.

---

## 5.1) Required Manual Validation Loop (Local, In-Workflow)

Purpose: catch visual drift immediately and avoid end-of-project surprises.

For each milestone:
1. Open the exact reference section from `/Users/abuusama/projects/starter-dapp/tanstack-web3/mockups/layout-1-command-center.html`.
2. Open the target Storybook story for that component/pattern.
3. Compare visually at desktop and mobile checkpoints.
4. Manually verify layout, spacing, typography, borders, shadows, state styling, and interaction affordances.
5. Exercise interactive states (`default`, `hover`, `focus`, `disabled`, `loading`, `error` where relevant).
6. Capture screenshots during review for milestone notes.
7. Fix mismatches immediately; do not defer to later phases.
8. Mark milestone complete only when checklist passes.

Tools used in this loop:
- MCP Playwright for navigation, interaction, and screenshots.
- `agent-browser` for quick repeated local visual checks.
- Storybook controls for state permutations.

Hard rule:
- No milestone advances without manual validation pass.

---

## 5.2) Milestone Acceptance Gates

Each milestone is independent and must pass before the next starts.

### Gate A: Foundations
- Token stories render correctly.
- Neo-brutal visual language matches reference.
- Desktop/mobile checkpoints reviewed.

### Gate B: Primitives
- Full state stories exist for each primitive.
- Keyboard focus and interaction states validated manually.
- Visual parity against mockup elements confirmed.

### Gate C: Patterns
- Patterns assemble from primitives only.
- Spacing/alignment matches command-center reference sections.
- Interactive behavior validated manually.

### Gate D: Domain/Safe Presentational Components
- UI-only components render with realistic fixtures.
- No business logic leaked into presentational layer.
- Section-level visual checks passed.

### Gate E: Compositions
- Section compositions match command-center hierarchy and layout.
- Desktop/mobile walkthrough completed.
- Final local manual walkthrough passed before route integration.

---

## 6) Suggested File Organization

Inside `/Users/abuusama/projects/starter-dapp/tanstack-web3/apps/web/src`:

- `design-system/foundations/` (tokens, global styles, theme contract)
- `design-system/primitives/`
- `design-system/patterns/`
- `design-system/domains/safe/`
- `design-system/compositions/command-center/`
- `design-system/fixtures/`
- `design-system/stories/` (if you prefer centralized stories) or colocated `*.stories.tsx`

Container split for existing features:

- Keep data/side effects in `/safe/**` hooks/containers.
- Render via presentational components from `design-system/**`.

---

## 7) Ready-To-Execute Checklist

1. Confirm reference source of truth for this phase: `/Users/abuusama/projects/starter-dapp/tanstack-web3/mockups/layout-1-command-center.html`.
2. Lock token naming convention (semantic tokens, not hardcoded hex in components).
3. Lock Storybook story colocation strategy (colocated vs centralized).
4. Lock manual validation checklist format and sign-off note format for each milestone.
5. Lock scope boundary for first pass: `apps/web` local design-system only, no package extraction yet.

---

## 7.1) Locked Defaults (Execution Starts Here)

These defaults are now fixed for this first implementation pass.

### A) Token Naming Convention
- Use semantic design-system tokens only (no raw hex values inside components).
- Prefix all tokens with `--ds-`.
- Token groups:
- `--ds-color-*` for surfaces, text, accents, status.
- `--ds-space-*` for spacing scale.
- `--ds-radius-*` for corner radii.
- `--ds-border-*` for border widths/styles.
- `--ds-shadow-*` for neo-brutal shadow depth.
- `--ds-font-*` and `--ds-type-*` for typography family/scale.

### B) Storybook Story Placement
- Use colocated stories (`*.stories.tsx`) next to component files under `design-system/**`.
- Use shared fixtures from `design-system/fixtures/**`.
- Keep one canonical "reference match" story per major component/pattern.

### C) Manual Validation Sign-Off Format
- Every milestone ends with a sign-off note in markdown using this structure:
- `Milestone`
- `Reference`
- `Stories Checked`
- `Viewports Checked`
- `States Checked`
- `Result` (`PASS` or `FAIL`)
- `Fixes Applied`
- `Open Gaps`
- Include screenshot paths for the validation pass.

### D) Scope Boundary (Pass 1)
- Build inside `/Users/abuusama/projects/starter-dapp/tanstack-web3/apps/web/src/design-system/**`.
- Do not extract to a shared package in this pass.
- Do not introduce CI gating work in this pass.

---

## 8) Success Criteria

- Every reusable component appears in Storybook with state coverage.
- Command-center screens are assembled from design-system components, not ad-hoc JSX.
- Business logic remains in feature containers, not in presentational components.
- Neo-brutalist style remains consistent through tokens, not per-component one-off styles.
