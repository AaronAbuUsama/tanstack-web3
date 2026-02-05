import { type ReactNode, createElement } from 'react'
import { SafeContext, type SafeContextValue } from '../lib/safe/provider'

export function createMockSafeContext(overrides?: Partial<SafeContextValue>): SafeContextValue {
  return {
    mode: 'standalone',
    isInSafe: false,
    safeAddress: null,
    owners: [],
    threshold: 0,
    chainId: null,
    loading: false,
    ...overrides,
  }
}

export function createMockIframeSafeContext(overrides?: Partial<SafeContextValue>): SafeContextValue {
  return {
    mode: 'iframe',
    isInSafe: true,
    safeAddress: '0x1234567890abcdef1234567890abcdef12345678',
    owners: [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    ],
    threshold: 1,
    chainId: 1,
    loading: false,
    ...overrides,
  }
}

export function MockSafeProvider({
  children,
  value,
}: {
  children: ReactNode
  value?: Partial<SafeContextValue>
}) {
  const contextValue = createMockSafeContext(value)
  return createElement(SafeContext.Provider, { value: contextValue }, children)
}
