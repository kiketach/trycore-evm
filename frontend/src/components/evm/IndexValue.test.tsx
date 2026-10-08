import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { COST_STATUS, SCHEDULE_STATUS } from '../../evm/status'
import { IndexValue } from './IndexValue'

describe('IndexValue', () => {
  it('gives screen readers the status and the unrounded value behind a 1,00 (D-06)', () => {
    render(<IndexValue rounded={1} unrounded={0.9999996} status={COST_STATUS.OVER_BUDGET} />)

    expect(screen.getByText('1,00')).toBeInTheDocument()
    expect(
      screen.getByText('Sobre presupuesto. Valor sin redondear: 0,9999996', {
        selector: '.visually-hidden',
      }),
    ).toBeInTheDocument()
  })

  it('keeps the visual icon and hint out of the accessibility tree', () => {
    render(<IndexValue rounded={0.8} unrounded={0.8} status={SCHEDULE_STATUS.BEHIND} />)

    expect(screen.getByText('✕')).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen.getByText('Atrasado. Valor sin redondear: 0,80', { selector: '.index-hint' }),
    ).toHaveAttribute('aria-hidden', 'true')
  })

  it('can be focused with the keyboard so the hint is not mouse-only', async () => {
    const user = userEvent.setup()
    render(<IndexValue rounded={1.25} unrounded={1.25} status={COST_STATUS.UNDER_BUDGET} />)

    await user.tab()

    expect(screen.getByText('1,25').closest('.index-value')).toHaveFocus()
  })

  it('explains a missing index instead of showing a status', () => {
    render(<IndexValue rounded={null} unrounded={null} status={COST_STATUS.NOT_AVAILABLE} />)

    expect(screen.getByText('N/D')).toBeInTheDocument()
    expect(
      screen.getByText('No disponible: la fórmula dividiría por cero.', {
        selector: '.visually-hidden',
      }),
    ).toBeInTheDocument()
  })
})
