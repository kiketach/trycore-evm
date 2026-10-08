import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { type FakeBackend, installFakeBackend } from './test/fakeBackend'

let backend: FakeBackend

beforeEach(() => {
  backend = installFakeBackend()
})

describe('App projects workflow', () => {
  it('asks to create the first project and then shows its activities', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Aún no tienes proyectos. Crea el primero.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre'), '  Portal de clientes  ')
    await user.type(screen.getByLabelText('Fecha de corte'), '2026-10-07')
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }))

    expect(backend.requestsTo('POST', '/projects')[0]?.body).toEqual({
      name: 'Portal de clientes',
      description: null,
      cutoff_date: '2026-10-07',
    })
    expect(await screen.findByRole('combobox', { name: 'Proyecto' })).toHaveDisplayValue(
      'Portal de clientes',
    )
    expect(screen.getByText('Fecha de corte: 2026-10-07')).toBeInTheDocument()
    expect(await screen.findByText(/Este proyecto aún no tiene actividades/)).toBeInTheDocument()
  })

  it('requires a project name', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Crear proyecto' }))

    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del proyecto es obligatorio.')
    expect(backend.requestsTo('POST', '/projects')).toEqual([])
  })

  it('loads the activities of the project chosen in the selector', async () => {
    backend.addProject({ name: 'Portal' })
    const billing = backend.addProject({ name: 'Facturación' })
    backend.addActivity(billing.id, {
      name: 'Integración DIAN',
      bac: 5000,
      planned_percent: 10,
      actual_percent: 5,
      actual_cost: 800,
    })
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Proyecto' }),
      'Facturación',
    )

    expect(await screen.findByLabelText('Nombre de Integración DIAN')).toBeInTheDocument()
  })

  it('edits the selected project', async () => {
    const portal = backend.addProject({ name: 'Portal', description: 'Fase 1' })
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const name = screen.getByLabelText('Nombre')
    expect(name).toHaveValue('Portal')
    await user.clear(name)
    await user.type(name, 'Portal v2')
    await user.click(screen.getByRole('button', { name: 'Guardar proyecto' }))

    expect(backend.requestsTo('PUT', `/projects/${String(portal.id)}`)[0]?.body).toEqual({
      name: 'Portal v2',
      description: 'Fase 1',
      cutoff_date: null,
    })
    expect(await screen.findByRole('combobox', { name: 'Proyecto' })).toHaveDisplayValue('Portal v2')
  })

  it('deletes the project after confirmation and offers to create one when none remain', async () => {
    const portal = backend.addProject({ name: 'Portal' })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Eliminar' }))

    expect(confirm).toHaveBeenCalledWith('¿Eliminar el proyecto «Portal» y todas sus actividades?')
    await waitFor(() => {
      expect(backend.requestsTo('DELETE', `/projects/${String(portal.id)}`)).toHaveLength(1)
    })
    expect(await screen.findByText('Aún no tienes proyectos. Crea el primero.')).toBeInTheDocument()
  })
})
