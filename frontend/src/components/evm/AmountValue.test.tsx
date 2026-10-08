import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AmountValue } from './AmountValue'

describe('AmountValue', () => {
  it('shows amounts below a million in full, as plain text', () => {
    const { container } = render(<AmountValue value={-999999.99} />)

    expect(container).toHaveTextContent('-999.999,99')
    expect(container.querySelector('.amount-value')).toBeNull()
  })

  it('shows a million or more in millions and keeps the full figure for screen readers', () => {
    render(<AmountValue value={2194787.38} />)

    expect(screen.getByText('2,19 M')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('2.194.787,38', { selector: '.visually-hidden' })).toBeInTheDocument()
  })

  it('lets keyboard users reach the full figure', async () => {
    const user = userEvent.setup()
    render(<AmountValue value={-1296290740.7} />)

    await user.tab()

    const value = screen.getByText('-1.296,29 M').closest('.amount-value')
    expect(value).toHaveFocus()
    expect(screen.getByText('-1.296.290.740,70', { selector: '.index-hint' })).toBeInTheDocument()
  })

  it('keeps N/D for amounts that could not be computed', () => {
    const { container } = render(<AmountValue value={null} />)

    expect(container).toHaveTextContent('N/D')
  })
})
