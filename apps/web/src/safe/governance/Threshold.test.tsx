import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Threshold from './Threshold'

describe('Threshold', () => {
  it('renders threshold value', () => {
    render(<Threshold threshold={2} ownerCount={3} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('of 3 owners')).toBeInTheDocument()
  })

  it('shows percentage', () => {
    render(<Threshold threshold={2} ownerCount={4} />)
    expect(screen.getByText('(50% required)')).toBeInTheDocument()
  })

  it('renders threshold buttons when onChangeThreshold provided', () => {
    render(<Threshold threshold={1} ownerCount={3} onChangeThreshold={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveTextContent('1')
    expect(buttons[1]).toHaveTextContent('2')
    expect(buttons[2]).toHaveTextContent('3')
  })
})
