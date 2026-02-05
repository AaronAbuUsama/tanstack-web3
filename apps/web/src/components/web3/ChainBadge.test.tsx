import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChainBadge from './ChainBadge'

describe('ChainBadge', () => {
  it('renders chain name', () => {
    render(<ChainBadge chainName="Ethereum" chainId={1} />)
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
  })

  it('shows connected indicator', () => {
    const { container } = render(<ChainBadge chainName="Ethereum" chainId={1} isConnected />)
    const dot = container.querySelector('.bg-green-300')
    expect(dot).toBeInTheDocument()
  })

  it('shows disconnected indicator by default', () => {
    const { container } = render(<ChainBadge chainName="Ethereum" chainId={1} />)
    const dot = container.querySelector('.bg-gray-300')
    expect(dot).toBeInTheDocument()
  })

  it('renders as button when onClick provided', () => {
    render(<ChainBadge chainName="Ethereum" chainId={1} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
