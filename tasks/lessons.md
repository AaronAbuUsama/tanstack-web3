# Lessons Learned

## 2026-02-06: E2E Validation Session

### Lesson 1: ERC165 compliance is mandatory for Safe Guards
- **Pattern**: Safe v1.3+ requires `supportsInterface(bytes4)` returning true for `type(IGuard).interfaceId` before `setGuard()` will store the guard address
- **What went wrong**: `SpendingLimitGuard.sol` was missing `IERC165` and `supportsInterface()`. The guard deployed fine, `setGuard` appeared to succeed, but the guard was never stored — transactions went through unblocked
- **Rule**: Any contract implementing Safe Guard MUST implement `IERC165` with `supportsInterface` returning true for both `type(IGuard).interfaceId` and `type(IERC165).interfaceId`

### Lesson 2: Unit tests are not enough — browser E2E testing is essential
- **Pattern**: All unit tests (vitest 35/35, forge 30/30) passed, build had 0 errors, but fundamental features were broken in the browser
- **What went wrong**: Guard didn't block transactions, chain showed wrong name, no way to fund Safe, redundant routes duplicated UI
- **Rule**: After any feature work, do real browser E2E validation. Click every button, test every flow. "Build passes + tests pass" does NOT mean "it works"

### Lesson 3: Anvil fork chain identity must be overridden
- **Pattern**: When Anvil forks a chain (e.g., Chiado ID 10200), wagmi uses the built-in chain name/metadata
- **What went wrong**: The app showed "Gnosis Chiado" instead of indicating it's a local Anvil fork
- **Rule**: Override chain name in dev mode: `{ ...chain, name: 'Anvil (Fork Name)' }`

### Lesson 4: TanStack Router child routes render INSIDE parent
- **Pattern**: `safe.transactions.tsx` is a child of `safe.tsx` via dot-separator convention. It renders inside `<Outlet />`
- **What went wrong**: Both `/safe` and `/safe/transactions` showed duplicate dashboard UI because the child rendered below the parent's content
- **Rule**: Don't create child routes unless you genuinely need nested rendering. Merge single-purpose child routes into the parent

### Lesson 5: Dev tooling (faucet) is critical for testability
- **Pattern**: Without a way to fund the Safe, no transaction testing is possible on Anvil
- **What went wrong**: No faucet or funding mechanism existed. E2E testing was impossible
- **Rule**: Every dev setup that involves a wallet/Safe MUST include a dev-only funding mechanism

### Lesson 6: Ethereum address comparison must be case-insensitive
- **Pattern**: Addresses from different sources (Safe SDK, viem deployment, localStorage) may have different EIP-55 checksumming — `"0x8F4e..."` vs `"0x8f4e..."`
- **What went wrong**: `modules.includes(deployedModuleAddress)` used strict `===`, so the module appeared both as "enabled" in the list AND showed "Enable Module" button because the cases didn't match
- **Rule**: ALWAYS compare Ethereum addresses with `.toLowerCase()` on both sides. Create an `addressEq(a, b)` helper and use it everywhere

### Lesson 7: UI state should reflect the state machine, not just data
- **Pattern**: The ModulePanel showed Deploy/Enable buttons even when the module was already enabled — redundant actions that cause confusing errors
- **What went wrong**: The panel had a flat render tree that didn't properly gate sections based on the module lifecycle (not deployed → deployed → enabled → managing)
- **Rule**: When a component has lifecycle states, structure the render as a clear state machine. Hide actions that don't apply to the current state

### Lesson 8: Contract bytecode must be recompiled after ABI changes
- **Pattern**: When adding `supportsInterface` to SpendingLimitGuard, the bytecode in `bytecodes.ts` must be regenerated
- **Rule**: After ANY Solidity contract change, recompile with `forge build` and update both `abis.ts` and `bytecodes.ts`
