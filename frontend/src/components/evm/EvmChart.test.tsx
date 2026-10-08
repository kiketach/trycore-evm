import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ActivityEvm } from '../../api/types'
import { EvmChart } from './EvmChart'

function activity(id: number, name: string, pv: number, ev: number, ac: number): ActivityEvm {
  return {
    activity_id: id, name, bac: 0, pv, ev, ac, cv: ev - ac, sv: ev - pv,
    cpi: null, spi: null, cpi_exact: null, spi_exact: null, eac: null, vac: null,
    cost_status: 'NOT_AVAILABLE', schedule_status: 'NOT_AVAILABLE',
  }  // prettier-ignore
}

describe('EvmChart', () => {
  it('offers the plotted PV, EV and AC as a table for every activity', () => {
    render(
      <EvmChart
        activities={[activity(1, 'Login', 5000, 4000, 3200), activity(2, 'Reportes', 5000, 10000, 12000)]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'PV, EV y AC por actividad' })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'PV, EV y AC por actividad' })
    const login = within(table).getByRole('row', { name: /Login/ })
    expect(within(login).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '5.000,00',
      '4.000,00',
      '3.200,00',
    ])
    const reportes = within(table).getByRole('row', { name: /Reportes/ })
    expect(within(reportes).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '5.000,00',
      '10.000,00',
      '12.000,00',
    ])
  })

  it('renders nothing for a project without activities', () => {
    const { container } = render(<EvmChart activities={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
