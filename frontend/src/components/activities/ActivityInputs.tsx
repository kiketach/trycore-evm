import { ACTIVITY_FIELDS, type ActivityDraft, type ActivityField, FIELD_LABELS } from '../../activities/draft'

interface ActivityInputsProps {
  draft: ActivityDraft
  rowLabel: string
  disabled: boolean
  onChange: (field: ActivityField, value: string) => void
}

const MONEY_STEP = '0.01'

export function ActivityInputs({ draft, rowLabel, disabled, onChange }: ActivityInputsProps) {
  return (
    <>
      {ACTIVITY_FIELDS.map((field) => (
        <td key={field}>
          <input
            aria-label={`${FIELD_LABELS[field]} de ${rowLabel}`}
            type={field === 'name' ? 'text' : 'number'}
            step={field === 'name' ? undefined : MONEY_STEP}
            value={draft[field]}
            disabled={disabled}
            onChange={(event) => {
              onChange(field, event.target.value)
            }}
          />
        </td>
      ))}
    </>
  )
}
