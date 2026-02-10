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
      data: '0x',
      confirmations: 1,
      confirmedBy: ['0x1111111111111111111111111111111111111111'],
      threshold: 2,
      isReady: false,
      source: 'local' as const,
    }]
    render(<TxQueue transactions={txs} onExecute={() => {}} />)
    expect(screen.getByText('Pending Transactions (1)')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Execute' })).not.toBeInTheDocument()
  })

  it('shows Ready status when confirmations meet threshold', () => {
    const txs = [{
      safeTxHash: 'tx1',
      to: '0x0000000000000000000000000000000000000001',
      value: '1.0',
      data: '0x',
      confirmations: 2,
      confirmedBy: [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ],
      threshold: 2,
      isReady: true,
      source: 'transaction-service' as const,
    }]
    render(<TxQueue transactions={txs} onExecute={() => {}} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Execute' })).toBeInTheDocument()
  })

  it('shows fallback mode helper text', () => {
    const txs = [{
      safeTxHash: 'tx1',
      to: '0x0000000000000000000000000000000000000001',
      value: '0',
      data: '0x',
      confirmations: 0,
      confirmedBy: [],
      threshold: 2,
      isReady: false,
      source: 'local' as const,
    }]
    render(
      <TxQueue
        transactions={txs}
        modeLabel="Local-only"
        modeHelpText="Pending queue is stored in local browser storage for this RPC/session."
      />,
    )

    expect(screen.getByText(/Local-only/)).toBeInTheDocument()
    expect(screen.getByText(/local browser storage/i)).toBeInTheDocument()
  })
})
