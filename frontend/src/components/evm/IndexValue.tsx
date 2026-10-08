import { indexExplanation, type StatusDisplay, TONE_ICON } from '../../evm/status'
import { formatNumber } from '../../format'

interface IndexValueProps {
  rounded: number | null
  unrounded: number | null
  status: StatusDisplay
}

// Shows CPI or SPI rounded, with its status icon. The status and the unrounded value (which
// explains a "1,00" marked over budget, D-06) reach every user:
// - screen readers read the visually hidden text;
// - mouse and keyboard users see the hint on hover or on focus, since the value is a tab stop.
export function IndexValue({ rounded, unrounded, status }: IndexValueProps) {
  const explanation = indexExplanation(unrounded, status)
  return (
    <span className={`index-value index-value--${status.tone}`} tabIndex={0}>
      <span aria-hidden="true" className="status-icon">
        {TONE_ICON[status.tone]}
      </span>
      <span>{formatNumber(rounded)}</span>
      <span className="visually-hidden">{explanation}</span>
      <span aria-hidden="true" className="index-hint">
        {explanation}
      </span>
    </span>
  )
}
