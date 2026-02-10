import { describe, it, expect } from 'vitest'
import { buildTransaction, buildTransactionStatus, hasSignerConfirmed, OperationType } from './transactions'

describe('OperationType', () => {
  it('has Call as 0', () => {
    expect(OperationType.Call).toBe(0)
  })
  it('has DelegateCall as 1', () => {
    expect(OperationType.DelegateCall).toBe(1)
  })
})

describe('buildTransaction', () => {
  it('builds with defaults', () => {
    const tx = buildTransaction({ to: '0x0000000000000000000000000000000000000001' })
    expect(tx.to).toBe('0x0000000000000000000000000000000000000001')
    expect(tx.value).toBe('0')
    expect(tx.data).toBe('0x')
    expect(tx.operation).toBe(OperationType.Call)
  })

  it('converts ETH value to wei', () => {
    const tx = buildTransaction({ to: '0x0000000000000000000000000000000000000001', value: '1' })
    expect(tx.value).toBe('1000000000000000000')
  })

  it('passes custom data', () => {
    const tx = buildTransaction({ to: '0x0000000000000000000000000000000000000001', data: '0xdeadbeef' })
    expect(tx.data).toBe('0xdeadbeef')
  })
})

describe('buildTransactionStatus', () => {
  it('uses signer list length when larger than explicit confirmations', () => {
    const status = buildTransactionStatus({
      safeTxHash: '0xhash',
      threshold: 2,
      confirmations: 1,
      confirmedBy: [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ],
      source: 'transaction-service',
    })

    expect(status.confirmations).toBe(2)
    expect(status.isReady).toBe(true)
  })

  it('is not ready when executed, even if threshold is met', () => {
    const status = buildTransactionStatus({
      safeTxHash: '0xhash',
      threshold: 1,
      confirmations: 1,
      source: 'local',
      isExecuted: true,
    })

    expect(status.isExecuted).toBe(true)
    expect(status.isReady).toBe(false)
  })
})

describe('hasSignerConfirmed', () => {
  it('matches signer addresses case-insensitively', () => {
    const status = buildTransactionStatus({
      safeTxHash: '0xhash',
      threshold: 2,
      source: 'transaction-service',
      confirmedBy: ['0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
    })

    expect(hasSignerConfirmed(status, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true)
    expect(hasSignerConfirmed(status, '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBe(false)
  })
})
