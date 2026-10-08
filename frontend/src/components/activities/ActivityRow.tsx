import type { Activity, ActivityEvm, ActivityWrite } from '../../api/types'
import { isSameDraft, toDraft } from '../../activities/draft'
import { useActivityDraft } from '../../hooks/useActivityDraft'
import { ActivityInputs } from './ActivityInputs'
import { IndicatorCells } from './IndicatorCells'
import { RowError } from './RowError'

interface ActivityRowProps {
  activity: Activity
  indicators: ActivityEvm | undefined
  onSave: (activityId: number, data: ActivityWrite) => Promise<void>
  onDelete: (activityId: number) => Promise<void>
}

export function ActivityRow({ activity, indicators, onSave, onDelete }: ActivityRowProps) {
  const saved = toDraft(activity)
  const { draft, setField, error, busy, submit, run } = useActivityDraft(saved)
  const dirty = !isSameDraft(draft, saved)

  function remove() {
    if (window.confirm(`¿Eliminar la actividad «${activity.name}»?`)) {
      void run(() => onDelete(activity.id))
    }
  }

  return (
    <>
      <tr>
        <ActivityInputs draft={draft} rowLabel={activity.name} disabled={busy} onChange={setField} />
        <IndicatorCells indicators={indicators} />
        <td className="actions">
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={() => void submit((data) => onSave(activity.id, data))}
          >
            Guardar
          </button>
          <button type="button" disabled={busy} onClick={remove}>
            Eliminar
          </button>
        </td>
      </tr>
      <RowError message={error} />
    </>
  )
}
