import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendTransactions } from '../core/iframe'
import { createTransaction, executeTransaction, signTransaction } from '../core/standalone'
import { useTransactions } from './use-transactions'

vi.mock('../core/standalone', () => ({
  createTransaction: vi.fn(async () => ({ mock: 'safeTx' })),
  signTransaction: vi.fn(async (_safeInstance, safeTx) => safeTx),
  executeTransaction: vi.fn(async () => ({ hash: '0xexecuted' })),
}))

vi.mock('../core/iframe', () => ({
  sendTransactions: vi.fn(async () => '0xiframehash'),
}))

describe('useTransactions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('keeps pending tx honest for threshold > 1', async () => {
    const { result } = renderHook(() =>
      useTransactions({
        safeAddress: '0xsafe',
        safeInstance: {} as any,
        threshold: 2,
        mode: 'standalone',
      }),
    )

    await act(async () => {
      await result.current.handleBuild({
        to: '0x0000000000000000000000000000000000000001',
        value: '1',
        data: '0x',
      })
    })

    expect(result.current.pendingTxs).toHaveLength(1)
    expect(result.current.pendingTxs[0].confirmations).toBe(0)

    const txId = result.current.pendingTxs[0].safeTxHash

    await act(async () => {
      await result.current.handleConfirm(txId)
    })

    expect(result.current.pendingTxs[0].confirmations).toBe(1)

    await act(async () => {
      await result.current.handleExecute(txId)
    })

    expect(result.current.txError).toBe('Not enough confirmations: 1/2')
    expect(vi.mocked(executeTransaction)).not.toHaveBeenCalled()
  })

  it('marks iframe submissions as pending, not executed', async () => {
    const { result } = renderHook(() =>
      useTransactions({
        safeAddress: '0xsafe',
        safeInstance: null,
        threshold: 2,
        mode: 'iframe',
      }),
    )

    await act(async () => {
      await result.current.handleBuild({
        to: '0x0000000000000000000000000000000000000002',
        value: '0.1',
        data: '0x',
      })
    })

    expect(vi.mocked(sendTransactions)).toHaveBeenCalledTimes(1)
    expect(result.current.pendingTxs).toHaveLength(1)
    expect(result.current.executedTxs).toHaveLength(0)
    expect(result.current.pendingTxs[0].safeTxHash).toBe('0xiframehash')
  })

  it('auto executes for threshold 1', async () => {
    const { result } = renderHook(() =>
      useTransactions({
        safeAddress: '0xsafe',
        safeInstance: {} as any,
        threshold: 1,
        mode: 'standalone',
      }),
    )

    await act(async () => {
      await result.current.handleBuild({
        to: '0x0000000000000000000000000000000000000001',
        value: '1',
        data: '0x',
      })
    })

    expect(vi.mocked(createTransaction)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(signTransaction)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(executeTransaction)).toHaveBeenCalledTimes(1)
    expect(result.current.executedTxs).toHaveLength(1)
    expect(result.current.pendingTxs).toHaveLength(0)
  })
})
