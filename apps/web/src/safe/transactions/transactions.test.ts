import { describe, it, expect } from 'vitest'
import { buildTransaction, OperationType } from './transactions'

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
