import type { EvmIndicators } from '../../api/types'
import { COST_STATUS, SCHEDULE_STATUS } from '../../evm/status'
import { formatNumber, NOT_AVAILABLE_HINT } from '../../format'
import { IndexValue } from '../evm/IndexValue'
import { INDICATOR_COLUMNS } from './columns'

export function IndicatorCells({ indicators }: { indicators: EvmIndicators | undefined }) {
  if (indicators === undefined) {
    return <td colSpan={INDICATOR_COLUMNS.length} />
  }
  return (
    <>
      {INDICATOR_COLUMNS.map(({ key }) => {
        if (key === 'cpi' || key === 'spi') {
          return (
            <td key={key} className="number">
              <IndexValue
                rounded={indicators[key]}
                unrounded={key === 'cpi' ? indicators.cpi_exact : indicators.spi_exact}
                status={
                  key === 'cpi'
                    ? COST_STATUS[indicators.cost_status]
                    : SCHEDULE_STATUS[indicators.schedule_status]
                }
              />
            </td>
          )
        }
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
