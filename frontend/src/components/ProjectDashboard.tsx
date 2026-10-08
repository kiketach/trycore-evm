import { useProjectActivities } from '../hooks/useProjectActivities'
import { ActivitiesTable } from './activities/ActivitiesTable'
import { EvmChart } from './evm/EvmChart'
import { ProjectSummary } from './evm/ProjectSummary'

// Loads a project's activities and indicators once and feeds the summary, the chart and
// the table from the same response, so the three views never disagree.
export function ProjectDashboard({ projectId }: { projectId: number }) {
  const { data, error, reload } = useProjectActivities(projectId)

  if (data === null) {
    return error === null ? (
      <p>Cargando actividades…</p>
    ) : (
      <p role="alert">No se pudieron cargar las actividades: {error}</p>
    )
  }

  return (
    <>
      <ProjectSummary summary={data.evm.summary} />
      <EvmChart activities={data.evm.activities} />
      <ActivitiesTable projectId={projectId} data={data} error={error} reload={reload} />
    </>
  )
}
