import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TxQueue from './TxQueue'

describe('TxQueue', () => {
  it('shows empty state', () => {
    render(<TxQueue transactions={[]} />)
    expect(screen.getByText('No pending transactions')).toBeInTheDocument()
  })

  it('renders pending transactions', () => {
    const txs = [{
      safeTxHash: 'tx1',
      to: '0x0000000000000000000000000000000000000001',
      value: '1.0',
      confirmations: 1,
      threshold: 2,
    }]
    render(<TxQueue transactions={txs} />)
    expect(screen.getByText('Pending Transactions (1)')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows Ready status when confirmations meet threshold', () => {
    const txs = [{
      safeTxHash: 'tx1',
      to: '0x0000000000000000000000000000000000000001',
      value: '1.0',
      confirmations: 2,
      threshold: 2,
    }]
    render(<TxQueue transactions={txs} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })
})
