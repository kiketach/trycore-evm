import type { EvmIndicators } from '../../api/types'
import { ACTIVITY_FIELDS } from '../../activities/draft'

export type IndicatorKey = keyof Omit<
  EvmIndicators,
  'bac' | 'ac' | 'cpi_exact' | 'spi_exact' | 'cost_status' | 'schedule_status'
>

// BAC and AC are already editable inputs; these are the read-only computed columns.
export const INDICATOR_COLUMNS: readonly { key: IndicatorKey; label: string; title: string }[] = [
  { key: 'pv', label: 'PV', title: 'Valor planeado = % planeado × BAC' },
  { key: 'ev', label: 'EV', title: 'Valor ganado = % real × BAC' },
  { key: 'cv', label: 'CV', title: 'Variación de costo = EV − AC' },
  { key: 'sv', label: 'SV', title: 'Variación de cronograma = EV − PV' },
  { key: 'cpi', label: 'CPI', title: 'Índice de desempeño de costo = EV / AC' },
  { key: 'spi', label: 'SPI', title: 'Índice de desempeño de cronograma = EV / PV' },
  { key: 'eac', label: 'EAC', title: 'Estimado al completar = BAC / CPI' },
  { key: 'vac', label: 'VAC', title: 'Variación al completar = BAC − EAC' },
]

const ACTIONS_COLUMNS = 1
export const TOTAL_COLUMNS = ACTIVITY_FIELDS.length + INDICATOR_COLUMNS.length + ACTIONS_COLUMNS
