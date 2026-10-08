import { type StatusDisplay, TONE_ICON } from '../../evm/status'

// Icon + label + colour: the status never depends on colour alone.
export function StatusBadge({ status }: { status: StatusDisplay }) {
  return (
    <span className={`status-badge status-badge--${status.tone}`}>
      <span aria-hidden="true" className="status-icon">
        {TONE_ICON[status.tone]}
      </span>
      {status.label}
    </span>
  )
}
