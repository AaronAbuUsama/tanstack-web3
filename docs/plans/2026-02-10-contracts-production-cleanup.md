# Contracts Production Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove demo Solidity artifacts and make the contracts package production-oriented around Safe guard/module contracts.

**Architecture:** Keep only production contracts in `packages/contracts/src`, production tests in `packages/contracts/test`, and deployment scripts in `packages/contracts/script`. Delete legacy example contracts (`Counter`, `SimpleStorage`, `MultiSigAction`) and update package/docs so every command points to existing production scripts.

**Tech Stack:** Foundry, Solidity 0.8.20, Bun workspaces, Turborepo

---

### Task 1: Remove Legacy Example Contracts

**Files:**
- Delete: `packages/contracts/examples/Counter.sol`
- Delete: `packages/contracts/examples/Counter.t.sol`
- Delete: `packages/contracts/examples/Counter.s.sol`
- Delete: `packages/contracts/examples/SimpleStorage.sol`
- Delete: `packages/contracts/examples/SimpleStorage.t.sol`
- Delete: `packages/contracts/examples/SimpleStorage.s.sol`
- Delete: `packages/contracts/examples/MultiSigAction.sol`
- Delete: `packages/contracts/examples/MultiSigAction.t.sol`
- Delete: `packages/contracts/examples/MultiSigAction.s.sol`

**Step 1: Confirm references before deletion**

Run: `rg -n "Counter|SimpleStorage|MultiSigAction|examples"`
Expected: references in docs and example files only.

**Step 2: Delete legacy files**

Run:
```bash
rm -rf packages/contracts/examples
```

**Step 3: Verify no runtime/build references remain**

Run: `rg -n "script/Counter.s.sol|Counter.sol|SimpleStorage.sol|MultiSigAction.sol"`
Expected: no references in production package scripts.

**Step 4: Commit**

```bash
git add packages/contracts
git commit -m "chore(contracts): remove legacy example contracts"
```

### Task 2: Fix Contracts Package Scripts

**Files:**
- Modify: `packages/contracts/package.json`

**Step 1: Write failing validation step**

Run: `cat packages/contracts/package.json`
Expected: current `deploy:local` references missing `script/Counter.s.sol`.

**Step 2: Implement minimal script fix**

Set scripts to:
- `deploy:guard:local` -> `script/SpendingLimitGuard.s.sol`
- `deploy:module:local` -> `script/AllowanceModule.s.sol`
- `deploy:local` -> alias to `deploy:guard:local`

**Step 3: Run script dry checks**

Run:
```bash
cd packages/contracts && forge script script/SpendingLimitGuard.s.sol --sig "run()"
cd packages/contracts && forge script script/AllowanceModule.s.sol --sig "run()"
```
Expected: scripts compile and run simulation.

**Step 4: Commit**

```bash
git add packages/contracts/package.json
git commit -m "chore(contracts): fix local deploy scripts"
```

### Task 3: Align Documentation with Production Contracts

**Files:**
- Modify: `README.md`
- Modify: `docs/development.md`
- Modify: `TUTORIAL.md`

**Step 1: Update contract list and deploy commands**

Replace `Counter/SimpleStorage/MultiSigAction` references with `SpendingLimitGuard/AllowanceModule` in quick-start docs.

**Step 2: Add explicit contract source of truth note**

Document that active contracts are under `packages/contracts/src` and scripts under `packages/contracts/script`.

**Step 3: Validate no stale deploy command remains in top-level docs**

Run: `rg -n "script/Counter.s.sol" README.md docs/development.md TUTORIAL.md`
Expected: zero matches.

**Step 4: Commit**

```bash
git add README.md docs/development.md TUTORIAL.md
git commit -m "docs: align contracts docs with production boilerplate"
```

### Task 4: Validate Contracts Package End-to-End

**Files:**
- Test: `packages/contracts/test/SpendingLimitGuard.t.sol`
- Test: `packages/contracts/test/AllowanceModule.t.sol`

**Step 1: Run full contract test suite**

Run: `cd packages/contracts && forge test -vv`
Expected: all tests pass.

**Step 2: Run root check for contracts package**

Run: `bun run test --filter=@tanstack-web3/contracts`
Expected: contracts tests pass through monorepo scripts (if filter is supported; otherwise document fallback).

**Step 3: Commit validation status**

If green, include test evidence in PR/summary.
