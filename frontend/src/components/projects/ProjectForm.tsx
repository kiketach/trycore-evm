import { type FormEvent, useState } from 'react'
import { errorMessage } from '../../api/client'
import type { Project, ProjectWrite } from '../../api/types'

interface ProjectFormProps {
  initial?: Project
  submitLabel: string
  onSubmit: (data: ProjectWrite) => Promise<void>
  onCancel?: () => void
}

export function ProjectForm({ initial, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [cutoffDate, setCutoffDate] = useState(initial?.cutoff_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() === '') {
      setError('El nombre del proyecto es obligatorio.')
      return
    }
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
        cutoff_date: cutoffDate === '' ? null : cutoffDate,
      })
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }

  return (
    <form className="project-form" onSubmit={(event) => void submit(event)}>
      <label>
        Nombre
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Descripción
        <input value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Fecha de corte
        <input
          type="date"
          value={cutoffDate}
          onChange={(event) => setCutoffDate(event.target.value)}
        />
      </label>
      <div className="actions">
        <button type="submit" className="button button--primary" disabled={busy}>
          {submitLabel}
        </button>
        {onCancel !== undefined && (
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
        )}
      </div>
      {error !== null && <p role="alert">{error}</p>}
    </form>
  )
}
