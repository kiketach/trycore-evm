import { formatAmountShort, formatNumber, isAbbreviated } from '../../format'

// A money amount in a narrow cell. From one million up it is shown in millions so it never
// breaks across lines; the full figure is read by screen readers and shown on hover or focus.
export function AmountValue({ value }: { value: number | null }) {
  if (value === null || !isAbbreviated(value)) {
    return <>{formatNumber(value)}</>
  }
  const full = formatNumber(value)
  return (
    <span className="amount-value" tabIndex={0}>
      <span aria-hidden="true">{formatAmountShort(value)}</span>
      <span className="visually-hidden">{full}</span>
      <span aria-hidden="true" className="index-hint">
        {full}
      </span>
    </span>
  )
}
