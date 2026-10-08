import { useState } from 'react'
import { errorMessage } from '../../api/client'
import { createProject, deleteProject, updateProject } from '../../api/projects'
import type { Project, ProjectWrite } from '../../api/types'
import { ProjectForm } from './ProjectForm'

interface ProjectPanelProps {
  projects: Project[]
  selected: Project | null
  onSelect: (projectId: number) => void
  // Called after a change; the id is the project to select next, or null for "any".
  onChanged: (selectId: number | null) => void
}

type Mode = 'view' | 'create' | 'edit'

export function ProjectPanel({ projects, selected, onSelect, onChanged }: ProjectPanelProps) {
  const [chosenMode, setMode] = useState<Mode>('view')
  // Without projects there is nothing to view or edit: always offer to create one.
  const mode: Mode = projects.length === 0 ? 'create' : chosenMode
  const [error, setError] = useState<string | null>(null)

  async function create(data: ProjectWrite) {
    const project = await createProject(data)
    setMode('view')
    onChanged(project.id)
  }

  async function update(project: Project, data: ProjectWrite) {
    await updateProject(project.id, data)
    setMode('view')
    onChanged(project.id)
  }

  async function remove(project: Project) {
    const question = `¿Eliminar el proyecto «${project.name}» y todas sus actividades?`
    if (!window.confirm(question)) {
      return
    }
    try {
      await deleteProject(project.id)
      setError(null)
      onChanged(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  if (mode === 'create') {
    return (
      <section aria-label="Nuevo proyecto" className="card">
        <h2>Nuevo proyecto</h2>
        {projects.length === 0 && <p>Aún no tienes proyectos. Crea el primero.</p>}
        <ProjectForm
          submitLabel="Crear proyecto"
          onSubmit={create}
          onCancel={projects.length === 0 ? undefined : () => setMode('view')}
        />
      </section>
    )
  }

  if (mode === 'edit' && selected !== null) {
    return (
      <section aria-label="Editar proyecto" className="card">
        <h2>Editar proyecto</h2>
        <ProjectForm
          initial={selected}
          submitLabel="Guardar proyecto"
          onSubmit={(data) => update(selected, data)}
          onCancel={() => setMode('view')}
        />
      </section>
    )
  }

  return (
    <section aria-label="Proyecto" className="card project-panel">
      <label>
        Proyecto
        <select
          value={selected?.id ?? ''}
          onChange={(event) => onSelect(Number(event.target.value))}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {selected?.cutoff_date && <span className="meta-pill">Fecha de corte: {selected.cutoff_date}</span>}
      <div className="actions">
        <button type="button" className="button button--primary" onClick={() => setMode('create')}>
          Nuevo proyecto
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={selected === null}
          onClick={() => setMode('edit')}
        >
          Editar
        </button>
        <button
          type="button"
          className="button button--danger"
          disabled={selected === null}
          onClick={() => selected !== null && void remove(selected)}
        >
          Eliminar
        </button>
      </div>
      {selected?.description && <p className="muted project-description">{selected.description}</p>}
      {error !== null && <p role="alert">{error}</p>}
    </section>
  )
}
