import { type StatusDisplay, TONE_ICON } from '../../evm/status'
import { formatNumber, NOT_AVAILABLE_HINT, unroundedHint } from '../../format'

interface IndexValueProps {
  rounded: number | null
  unrounded: number | null
  status: StatusDisplay
}

// Shows CPI or SPI rounded, with the status icon and the unrounded value on hover, so a
// "1,00" marked over budget explains itself (D-06).
export function IndexValue({ rounded, unrounded, status }: IndexValueProps) {
  return (
    <span
      className={`index-value index-value--${status.tone}`}
      title={unrounded === null ? NOT_AVAILABLE_HINT : `${status.label}. ${unroundedHint(unrounded)}`}
    >
      <span aria-hidden="true" className="status-icon">
        {TONE_ICON[status.tone]}
      </span>
      <span>{formatNumber(rounded)}</span>
    </span>
  )
}
