import type { EvmIndicators } from '../../api/types'
import { formatNumber, NOT_AVAILABLE_HINT } from '../../format'
import { INDICATOR_COLUMNS } from './columns'

export function IndicatorCells({ indicators }: { indicators: EvmIndicators | undefined }) {
  if (indicators === undefined) {
    return <td colSpan={INDICATOR_COLUMNS.length} />
  }
  return (
    <>
      {INDICATOR_COLUMNS.map(({ key }) => {
        const value = indicators[key]
        return (
          <td key={key} className="number" title={value === null ? NOT_AVAILABLE_HINT : undefined}>
            {formatNumber(value)}
          </td>
        )
      })}
    </>
  )
}
