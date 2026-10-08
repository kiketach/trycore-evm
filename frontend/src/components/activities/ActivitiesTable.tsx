import { createActivity, deleteActivity, updateActivity } from '../../api/activities'
import type { ActivityWrite } from '../../api/types'
import { ACTIVITY_FIELDS, FIELD_LABELS } from '../../activities/draft'
import type { ProjectActivities } from '../../hooks/useProjectActivities'
import { ActivityRow } from './ActivityRow'
import { INDICATOR_COLUMNS, TOTAL_COLUMNS } from './columns'
import { NewActivityRow } from './NewActivityRow'

interface ActivitiesTableProps {
  projectId: number
  data: ProjectActivities
  // Set when a reload after a change failed; the table keeps the last good data.
  error: string | null
  reload: () => void
}

export function ActivitiesTable({ projectId, data, error, reload }: ActivitiesTableProps) {
  const indicatorsById = new Map(data.evm.activities.map((a) => [a.activity_id, a]))

  async function create(values: ActivityWrite) {
    await createActivity(projectId, values)
    reload()
  }

  async function save(activityId: number, values: ActivityWrite) {
    await updateActivity(projectId, activityId, values)
    reload()
  }

  async function remove(activityId: number) {
    await deleteActivity(projectId, activityId)
    reload()
  }

  return (
    <section aria-label="Actividades" className="card">
      <h2>Actividades</h2>
      <p className="muted section-help">
        Escribe los datos de cada actividad y pulsa Guardar: los indicadores se recalculan al
        instante. Pasa el cursor sobre un encabezado para ver su fórmula. «M» significa millones:
        pasa el cursor o enfoca el valor para ver la cifra completa.
      </p>
      {error !== null && <p role="alert">No se pudieron actualizar los datos: {error}</p>}
      <table className="activities-table">
        <colgroup>
          {ACTIVITY_FIELDS.map((field) => (
            <col key={field} className={`col-${field}`} />
          ))}
          {INDICATOR_COLUMNS.map(({ key }) => (
            <col key={key} className="col-indicator" />
          ))}
          <col className="col-actions" />
        </colgroup>
        <thead>
          <tr className="group-header">
            <th colSpan={ACTIVITY_FIELDS.length} scope="colgroup">
              Datos de la actividad
            </th>
            <th colSpan={INDICATOR_COLUMNS.length} scope="colgroup" className="computed">
              Indicadores calculados
            </th>
            <th aria-hidden="true" />
          </tr>
          <tr>
            {ACTIVITY_FIELDS.map((field) => (
              <th key={field} scope="col">
                {FIELD_LABELS[field]}
              </th>
            ))}
            {INDICATOR_COLUMNS.map(({ key, label, title }) => (
              <th key={key} scope="col" title={title} className="computed number">
                {label}
              </th>
            ))}
            <th scope="col">
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.activities.length === 0 && (
            <tr className="row-message">
              <td colSpan={TOTAL_COLUMNS}>
                Este proyecto aún no tiene actividades. Agrega la primera en la última fila.
              </td>
            </tr>
          )}
          {data.activities.map((activity) => (
            <ActivityRow
              // A new key after each save resets the row's draft to the stored values.
              key={`${String(activity.id)}-${activity.updated_at}`}
              activity={activity}
              indicators={indicatorsById.get(activity.id)}
              onSave={save}
              onDelete={remove}
            />
          ))}
          <NewActivityRow onCreate={create} />
        </tbody>
      </table>
    </section>
  )
}
