import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TxBuilder from './TxBuilder'

describe('TxBuilder', () => {
  it('renders form fields', () => {
    render(<TxBuilder onBuild={vi.fn()} />)
    const hexFields = screen.getAllByPlaceholderText('0x...')
    expect(hexFields).toHaveLength(2) // recipient input + data textarea
    expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument()
  })

  it('disables submit without to address', () => {
    render(<TxBuilder onBuild={vi.fn()} />)
    const button = screen.getByText('Build Transaction')
    expect(button).toBeDisabled()
  })

  it('calls onBuild with form values', () => {
    const onBuild = vi.fn()
    render(<TxBuilder onBuild={onBuild} />)
    const recipientInput = screen.getAllByPlaceholderText('0x...')[0]
    fireEvent.change(recipientInput, {
      target: { value: '0x0000000000000000000000000000000000000001' },
    })
    fireEvent.submit(screen.getByText('Build Transaction').closest('form')!)
    expect(onBuild).toHaveBeenCalledWith({
      to: '0x0000000000000000000000000000000000000001',
      value: '0',
      data: '0x',
    })
  })
})
