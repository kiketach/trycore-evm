import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EvmIndicators } from '../../api/types'
import { ProjectSummary } from './ProjectSummary'

// Project of three activities computed by hand in backend/tests/integration/test_evm.py.
const PORTAL: EvmIndicators = {
  bac: 31000, pv: 10500, ev: 14300, ac: 15200, cv: -900, sv: 3800,
  cpi: 0.94, spi: 1.36, cpi_exact: 14300 / 15200, spi_exact: 14300 / 10500,
  eac: 32951.05, vac: -1951.05,
  cost_status: 'OVER_BUDGET', schedule_status: 'AHEAD',
}  // prettier-ignore

function indexTile(name: 'CPI del proyecto' | 'SPI del proyecto'): HTMLElement {
  return screen.getByRole('article', { name })
}

describe('ProjectSummary', () => {
  it('states at a glance how the project is doing', () => {
    render(<ProjectSummary summary={PORTAL} />)

    expect(screen.getByText('Costo: sobre presupuesto. Cronograma: adelantado.')).toBeInTheDocument()
    const cpi = indexTile('CPI del proyecto')
    expect(within(cpi).getByText('0,94')).toBeInTheDocument()
    expect(within(cpi).getByText('Sobre presupuesto')).toHaveClass('status-badge--bad')
    const spi = indexTile('SPI del proyecto')
    expect(within(spi).getByText('1,36')).toBeInTheDocument()
    expect(within(spi).getByText('Adelantado')).toHaveClass('status-badge--good')
  })

  it('shows every consolidated amount with its formula', () => {
    render(<ProjectSummary summary={PORTAL} />)

    for (const [label, value] of [
      ['Presupuesto (BAC)', '31.000,00'],
      ['Valor planeado (PV)', '10.500,00'],
      ['Valor ganado (EV)', '14.300,00'],
      ['Costo real (AC)', '15.200,00'],
      ['Variación de costo (CV)', '-900,00'],
      ['Variación de cronograma (SV)', '3.800,00'],
      ['Estimado al completar (EAC)', '32.951,05'],
      ['Variación al completar (VAC)', '-1.951,05'],
    ]) {
      const tile = screen.getByText(label).closest('.tile')
      expect(tile).not.toBeNull()
      expect(within(tile as HTMLElement).getByText(value)).toBeInTheDocument()
    }
  })

  it('explains a 1,00 shown in red with its unrounded value (D-06)', () => {
    render(
      <ProjectSummary
        summary={{ ...PORTAL, cpi: 1, cpi_exact: 0.9996, cost_status: 'OVER_BUDGET' }}
      />,
    )

    const cpi = indexTile('CPI del proyecto')
    const value = within(cpi).getByText('1,00').closest('.index-value')
    expect(value).toHaveClass('index-value--bad')
    expect(
      within(cpi).getByText('Sobre presupuesto. Valor sin redondear: 0,9996', {
        selector: '.visually-hidden',
      }),
    ).toBeInTheDocument()
    expect(within(cpi).getByText('Sobre presupuesto')).toBeInTheDocument()
  })

  it('shows grey N/D when the project has no data to evaluate', () => {
    render(
      <ProjectSummary
        summary={{
          ...PORTAL,
          cpi: null, spi: null, cpi_exact: null, spi_exact: null, eac: null, vac: null,
          cost_status: 'NOT_AVAILABLE', schedule_status: 'NOT_AVAILABLE',
        }}  // prettier-ignore
      />,
    )

    expect(
      screen.getByText('Aún no hay datos suficientes para evaluar el proyecto.'),
    ).toBeInTheDocument()
    const cpi = indexTile('CPI del proyecto')
    expect(within(cpi).getByText('N/D').closest('.index-value')).toHaveClass('index-value--neutral')
    expect(within(cpi).getByText('No disponible')).toHaveClass('status-badge--neutral')
  })
})
