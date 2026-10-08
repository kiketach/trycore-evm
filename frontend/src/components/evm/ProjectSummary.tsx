import type { EvmIndicators } from '../../api/types'
import {
  COST_STATUS,
  projectVerdict,
  SCHEDULE_STATUS,
  TONE_ICON,
  verdictTone,
} from '../../evm/status'
import { formatNumber } from '../../format'
import { IndexValue } from './IndexValue'
import { StatusBadge } from './StatusBadge'

type MoneyKey = 'bac' | 'pv' | 'ev' | 'ac' | 'cv' | 'sv' | 'eac' | 'vac'

const MONEY_TILES: readonly { key: MoneyKey; label: string; formula: string }[] = [
  { key: 'bac', label: 'Presupuesto (BAC)', formula: 'Suma de los BAC' },
  { key: 'pv', label: 'Valor planeado (PV)', formula: '% planeado × BAC' },
  { key: 'ev', label: 'Valor ganado (EV)', formula: '% real × BAC' },
  { key: 'ac', label: 'Costo real (AC)', formula: 'Suma de los AC' },
  { key: 'cv', label: 'Variación de costo (CV)', formula: 'EV − AC' },
  { key: 'sv', label: 'Variación de cronograma (SV)', formula: 'EV − PV' },
  { key: 'eac', label: 'Estimado al completar (EAC)', formula: 'BAC / CPI' },
  { key: 'vac', label: 'Variación al completar (VAC)', formula: 'BAC − EAC' },
]

export function ProjectSummary({ summary }: { summary: EvmIndicators }) {
  const cost = COST_STATUS[summary.cost_status]
  const schedule = SCHEDULE_STATUS[summary.schedule_status]
  const verdict = verdictTone(summary.cost_status, summary.schedule_status)

  return (
    <section aria-label="Indicadores del proyecto" className="summary">
      <h2>Indicadores del proyecto</h2>
      <p className={`verdict verdict--${verdict}`}>
        <span aria-hidden="true" className="status-icon">
          {TONE_ICON[verdict]}
        </span>
        {projectVerdict(summary.cost_status, summary.schedule_status)}
      </p>
      <div className="index-tiles">
        <article className={`tile tile--index tile--${cost.tone}`} aria-label="CPI del proyecto">
          <h3>Desempeño de costo (CPI)</h3>
          <p className="tile-value">
            <IndexValue rounded={summary.cpi} unrounded={summary.cpi_exact} status={cost} />
          </p>
          <StatusBadge status={cost} />
          <p className="muted">EV / AC. Mayor que 1: cada peso gastado rinde más de lo planeado.</p>
        </article>
        <article className={`tile tile--index tile--${schedule.tone}`} aria-label="SPI del proyecto">
          <h3>Desempeño de cronograma (SPI)</h3>
          <p className="tile-value">
            <IndexValue rounded={summary.spi} unrounded={summary.spi_exact} status={schedule} />
          </p>
          <StatusBadge status={schedule} />
          <p className="muted">EV / PV. Mayor que 1: se avanzó más de lo planeado a la fecha.</p>
        </article>
      </div>
      <dl className="money-tiles">
        {MONEY_TILES.map(({ key, label, formula }) => (
          <div key={key} className="tile">
            <dt>{label}</dt>
            <dd className="tile-number">{formatNumber(summary[key])}</dd>
            <dd className="muted">{formula}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
