import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ActivityEvm } from '../../api/types'
import { formatNumber } from '../../format'

// Categorical slots 1-3 of the validated reference palette (dataviz skill), fixed order.
const SERIES = [
  { key: 'pv', label: 'PV (planeado)', color: 'var(--series-1)' },
  { key: 'ev', label: 'EV (ganado)', color: 'var(--series-2)' },
  { key: 'ac', label: 'AC (costo real)', color: 'var(--series-3)' },
] as const

const CHART_HEIGHT = 320
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
const BAR_GAP = 2

// Legend text stays in text ink; the colour swatch beside it carries the series identity.
function legendLabel(value: string) {
  return <span className="legend-label">{value}</span>
}

function formatTooltipValue(value: unknown): string {
  return typeof value === 'number' ? formatNumber(value) : String(value)
}

export function EvmChart({ activities }: { activities: ActivityEvm[] }) {
  if (activities.length === 0) {
    return null
  }

  return (
    <section aria-label="Gráfica PV, EV y AC" className="card chart">
      <h2>PV, EV y AC por actividad</h2>
      <p className="muted">
        Si EV queda por debajo de PV, la actividad va atrasada; si AC supera a EV, se está
        gastando más de lo que vale el trabajo hecho.
      </p>
      <div className="chart-frame" aria-hidden="true">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={activities} barGap={BAR_GAP} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-muted)' }} />
            <YAxis tickFormatter={formatNumber} tick={{ fill: 'var(--color-muted)' }} width={96} />
            <Tooltip formatter={formatTooltipValue} cursor={{ fill: 'var(--hover)' }} />
            <Legend itemSorter={null} formatter={legendLabel} />
            {SERIES.map(({ key, label, color }) => (
              <Bar key={key} dataKey={key} name={label} fill={color} radius={BAR_RADIUS} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details>
        <summary>Ver los datos de la gráfica</summary>
        <table>
          <caption>PV, EV y AC por actividad</caption>
          <thead>
            <tr>
              <th scope="col">Actividad</th>
              {SERIES.map(({ key, label }) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.activity_id}>
                <th scope="row">{activity.name}</th>
                {SERIES.map(({ key }) => (
                  <td key={key} className="number">
                    {formatNumber(activity[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
