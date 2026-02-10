# Layout 1 Command-Center Reference Spec

Reference source:
- `mockups/layout-1-command-center.html`

This spec captures measurable rules that must drive token and component work.

## Palette (Reference CSS Variables)

From `:root` in reference:

- `--black`: `#1a1a2e`
- `--white`: `#fefefe`
- `--yellow`: `#FFE66D`
- `--pink`: `#FF6B9D`
- `--blue`: `#4ECDC4`
- `--purple`: `#C44DFF`
- `--orange`: `#FF8A5C`
- `--green`: `#95E86B`
- `--red`: `#FF4757`
- `--lavender`: `#D4ADFC`
- `--cream`: `#FFF8E7`
- `--sky`: `#A8E6CF`

Supporting neutral colors used in specific sections:

- Dashed separators: `#e0e0e0` (activity/reset separators)
- Progress backgrounds: `#e8e8e8` (limit/allowance tracks)

## Border and Shadow System

Primary border language:

- Regular border: `3px solid var(--black)`
- Thick border: `4px solid var(--black)`
- Inline/control borders: `2px solid var(--black)`
- Dashed boundary variant: `3px dashed var(--black)` (add-delegate card)

Shadow geometry:

- Standard shadow: `5px 5px 0px var(--black)`
- Small shadow: `3px 3px 0px var(--black)`
- Large shadow: `8px 8px 0px var(--black)`
- Hover collapse pattern: translate by `2px,2px`, reduce shadow to `1px 1px 0px var(--black)` or none

## Typography

Font families:

- Primary: `"Space Grotesk", sans-serif`
- Mono: `"Space Mono", monospace`

Observed weight usage:

- `400` body/default
- `500` nav-item default
- `600` quick action / activity title
- `700` headings, badges, values

Observed size rhythm:

- Utility/meta: `10px`, `11px`, `12px`, `13px`
- Body labels: `14px`, `15px`
- Headings/value scales: `18px`, `20px`, `24px`, `28px`, `32px`, `40px`, `48px`

## Spacing Rhythm

Frequent spacing values in layout:

- micro: `2px`, `3px`, `4px`, `6px`, `8px`
- controls: `10px`, `12px`, `14px`, `16px`
- structural: `20px`, `24px`, `32px`, `40px`

Usage anchors:

- Status bar: `padding: 10px 24px`
- Sidebar identity: `padding: 24px 20px`
- Card header/body: `16px 20px` / `20px`
- Main content: `32px`

## Layout Structure

Top-level:

- `body`: column layout, min-height `100vh`, background `var(--cream)`
- `.status-bar`: fixed top visual bar with thick bottom border
- `.app-layout`: row split, min-height `calc(100vh - 44px)`

Shell dimensions:

- Sidebar width: `280px`
- Main content expands with scroll

Panel shape:

- White cards with regular border + standard shadow
- Header rows have regular border separators

## Component Mapping Targets

This mapping is used by Storybook stories and later shell/pattern components.

- Status bar shell:
  - `.status-bar`, `.chain-badge`, `.wallet-info`, `.balance-pill`, `.disconnect-btn`
- Sidebar shell:
  - `.sidebar`, `.safe-identity`, `.sidebar-nav`, `.nav-item`, `.sidebar-footer`
- Panel shell:
  - `.card`, `.card-header`, `.card-body`
- Primitive button/input/badge:
  - `.btn*`, `.form-group input/textarea/select`, `.owner-tag/.nav-badge/.header-tag`

## Non-Goals For This Milestone

- Do not introduce alternate visual themes beyond the canonical layout-1 defaults.
- Do not expand to layout-2/layout-3 abstractions until layout-1 integration is stable.
