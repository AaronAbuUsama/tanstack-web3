import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressDisplay from './AddressDisplay'

describe('AddressDisplay', () => {
  const addr = '0x1234567890123456789012345678901234567890'

  it('truncates address by default', () => {
    render(<AddressDisplay address={addr} />)
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
  })

  it('shows full address when truncate is false', () => {
    render(<AddressDisplay address={addr} truncate={false} />)
    expect(screen.getByText(addr)).toBeInTheDocument()
  })

  it('shows copy button by default', () => {
    render(<AddressDisplay address={addr} />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('hides copy button when showCopy is false', () => {
    render(<AddressDisplay address={addr} showCopy={false} />)
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('shows ENS name when provided', () => {
    render(<AddressDisplay address={addr} ensName="vitalik.eth" />)
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument()
  })
})
