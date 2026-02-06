import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Owners from './Owners'

describe('Owners', () => {
  const owners = ['0x1234567890123456789012345678901234567890', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd']

  it('renders owner count', () => {
    render(<Owners owners={owners} />)
    expect(screen.getByText('Owners (2)')).toBeInTheDocument()
  })

  it('shows truncated addresses', () => {
    render(<Owners owners={owners} />)
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
  })

  it('shows "(you)" for current address', () => {
    render(<Owners owners={owners} currentAddress={owners[0]} />)
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })

  it('renders add owner input when onAddOwner provided', () => {
    render(<Owners owners={owners} onAddOwner={vi.fn()} />)
    expect(screen.getByPlaceholderText('0x... new owner address')).toBeInTheDocument()
  })
})
