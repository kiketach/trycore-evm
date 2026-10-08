import type { ActivityWrite } from '../../api/types'
import { EMPTY_DRAFT } from '../../activities/draft'
import { useActivityDraft } from '../../hooks/useActivityDraft'
import { ActivityInputs } from './ActivityInputs'
import { IndicatorCells } from './IndicatorCells'
import { RowError } from './RowError'

export const NEW_ROW_LABEL = 'la nueva actividad'

export function NewActivityRow({ onCreate }: { onCreate: (data: ActivityWrite) => Promise<void> }) {
  const { draft, setDraft, setField, error, busy, submit } = useActivityDraft(EMPTY_DRAFT)

  async function add() {
    if (await submit(onCreate)) {
      setDraft(EMPTY_DRAFT)
    }
  }

  return (
    <>
      <tr className="new-row">
        <ActivityInputs draft={draft} rowLabel={NEW_ROW_LABEL} disabled={busy} onChange={setField} />
        <IndicatorCells indicators={undefined} />
        <td className="actions">
          <button type="button" disabled={busy} onClick={() => void add()}>
            Agregar
          </button>
        </td>
      </tr>
      <RowError message={error} />
    </>
  )
}
