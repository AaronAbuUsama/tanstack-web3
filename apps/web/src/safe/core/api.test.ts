import SafeApiKit from '@safe-global/api-kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearApiKitCacheForTests,
  confirmTransaction,
  getApiKit,
  getPendingTransactions,
  getTransaction,
  getTxServiceUrl,
  isTxServiceSupportedChain,
  proposeTransaction,
} from './api'

const proposeTransactionSpy = vi.fn(async () => undefined)
const getTransactionSpy = vi.fn(async () => ({ safeTxHash: '0xabc' }))
const confirmTransactionSpy = vi.fn(async () => ({ signature: '0xsig' }))
const getPendingTransactionsSpy = vi.fn(async () => ({
  count: 1,
  next: null,
  previous: null,
  results: [{ safeTxHash: '0xpending' }],
}))

vi.mock('@safe-global/api-kit', () => ({
  default: vi.fn().mockImplementation(() => ({
    proposeTransaction: proposeTransactionSpy,
    getTransaction: getTransactionSpy,
    confirmTransaction: confirmTransactionSpy,
    getPendingTransactions: getPendingTransactionsSpy,
  })),
}))

describe('safe/core/api', () => {
  beforeEach(() => {
    clearApiKitCacheForTests()
    vi.clearAllMocks()
  })

  it.each([
    [1, 'https://safe-transaction-mainnet.safe.global'],
    [100, 'https://safe-transaction-gnosis-chain.safe.global'],
    [10200, 'https://safe-transaction-chiado.safe.global'],
    [11155111, 'https://safe-transaction-sepolia.safe.global'],
  ])('maps chain %d to tx service %s', (chainId, txServiceUrl) => {
    const api = getApiKit(chainId)

    expect(api).toBeDefined()
    expect(SafeApiKit).toHaveBeenCalledWith({
      chainId: BigInt(chainId),
      txServiceUrl,
    })
  })

  it('throws for unsupported chain ids', () => {
    expect(() => getApiKit(31337)).toThrow('Safe Transaction Service is not configured for chainId 31337.')
  })

  it('exposes support helpers', () => {
    expect(isTxServiceSupportedChain(10200)).toBe(true)
    expect(isTxServiceSupportedChain(31337)).toBe(false)
    expect(getTxServiceUrl(11155111)).toBe('https://safe-transaction-sepolia.safe.global')
    expect(getTxServiceUrl(31337)).toBeNull()
  })

  it('delegates propose/get/confirm/pending calls to api kit', async () => {
    await proposeTransaction({
      chainId: 10200,
      safeAddress: '0xsafe',
      safeTxHash: '0xhash',
      senderAddress: '0xowner',
      senderSignature: '0xsig',
      safeTransactionData: {
        to: '0x0000000000000000000000000000000000000001',
        value: '0',
        data: '0x',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1,
      },
    })
    await getTransaction({ chainId: 10200, safeTxHash: '0xhash' })
    await confirmTransaction({ chainId: 10200, safeTxHash: '0xhash', signature: '0xsig' })
    const pending = await getPendingTransactions({ chainId: 10200, safeAddress: '0xsafe' })

    expect(proposeTransactionSpy).toHaveBeenCalledTimes(1)
    expect(getTransactionSpy).toHaveBeenCalledWith('0xhash')
    expect(confirmTransactionSpy).toHaveBeenCalledWith('0xhash', '0xsig')
    expect(getPendingTransactionsSpy).toHaveBeenCalledWith('0xsafe')
    expect(pending).toEqual([{ safeTxHash: '0xpending' }])
  })
})
