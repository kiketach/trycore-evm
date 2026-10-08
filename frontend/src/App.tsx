import { useState } from 'react'
import { BackendStatus } from './components/BackendStatus'
import { ProjectDashboard } from './components/ProjectDashboard'
import { ProjectPanel } from './components/projects/ProjectPanel'
import { useProjects } from './hooks/useProjects'

function App() {
  const { projects, error, reload } = useProjects()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // No explicit choice yet (or the chosen project was deleted): show the first project.
  const selected =
    projects === null
      ? null
      : (projects.find((project) => project.id === selectedId) ??
        (selectedId === null ? (projects.at(0) ?? null) : null))

  function handleChanged(selectId: number | null) {
    setSelectedId(selectId)
    reload()
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Dashboard de Valor Ganado</h1>
        <BackendStatus />
      </header>
      {error !== null && <p role="alert">No se pudieron cargar los proyectos: {error}</p>}
      {projects === null ? (
        error === null && <p>Cargando proyectos…</p>
      ) : (
        <>
          <ProjectPanel
            projects={projects}
            selected={selected}
            onSelect={setSelectedId}
            onChanged={handleChanged}
          />
          {selected !== null && <ProjectDashboard key={selected.id} projectId={selected.id} />}
        </>
      )}
    </main>
  )
}

export default App
