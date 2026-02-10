import { privateKeyToAccount } from 'viem/accounts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getDevWalletAccountForIndex,
  getDevWalletActiveAccount,
  getDevWalletActiveAccountIndex,
  getDevWalletActiveSigner,
  getDevWalletSignerForIndex,
  setDevWalletActiveAccountIndex,
} from './dev-wallet'

describe('dev-wallet', () => {
  beforeEach(() => {
    setDevWalletActiveAccountIndex(0)
  })

  afterEach(() => {
    setDevWalletActiveAccountIndex(0)
  })

  it('derives deterministic anvil-compatible addresses by index', () => {
    expect(getDevWalletAccountForIndex(0).address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    expect(getDevWalletAccountForIndex(1).address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  })

  it('derives private keys that match the indexed addresses', () => {
    const signer0 = getDevWalletSignerForIndex(0)
    const signer1 = getDevWalletSignerForIndex(1)

    expect(privateKeyToAccount(signer0).address).toBe(getDevWalletAccountForIndex(0).address)
    expect(privateKeyToAccount(signer1).address).toBe(getDevWalletAccountForIndex(1).address)
    expect(signer0).not.toBe(signer1)
  })

  it('uses the active account index to resolve active signer and address', () => {
    expect(getDevWalletActiveAccountIndex()).toBe(0)

    setDevWalletActiveAccountIndex(2)

    expect(getDevWalletActiveAccountIndex()).toBe(2)
    expect(getDevWalletActiveAccount().address).toBe(getDevWalletAccountForIndex(2).address)
    expect(getDevWalletActiveSigner()).toBe(getDevWalletSignerForIndex(2))
  })

  it('throws on invalid account index inputs', () => {
    expect(() => setDevWalletActiveAccountIndex(-1)).toThrow(
      'Dev wallet account index must be a non-negative integer.',
    )
    expect(() => getDevWalletAccountForIndex(1.5)).toThrow(
      'Dev wallet account index must be a non-negative integer.',
    )
  })
})
