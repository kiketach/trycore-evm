import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type FakeBackend, installFakeBackend } from '../../test/fakeBackend'
import { ActivitiesTable } from './ActivitiesTable'

const LOGIN = {
  name: 'Login',
  bac: 10000,
  planned_percent: 50,
  actual_percent: 40,
  actual_cost: 3200,
}

let backend: FakeBackend
let projectId: number

beforeEach(() => {
  backend = installFakeBackend()
  projectId = backend.addProject({ name: 'Portal' }).id
})

async function findRow(name: string): Promise<HTMLElement> {
  const nameInput = await screen.findByLabelText(`Nombre de ${name}`)
  const row = nameInput.closest('tr')
  if (row === null) throw new Error(`no row for ${name}`)
  return row
}

describe('ActivitiesTable', () => {
  it('shows each activity with the indicators returned by the backend', async () => {
    backend.addActivity(projectId, LOGIN)
    backend.indicators.set('Login', {
      pv: 5000, ev: 4000, cv: 800, sv: -1000, cpi: 1.25, spi: 0.8, eac: 8000, vac: 2000,
    })  // prettier-ignore

    render(<ActivitiesTable projectId={projectId} />)

    const row = await findRow('Login')
    expect(within(row).getByLabelText('BAC de Login')).toHaveValue(10000)
    expect(within(row).getByLabelText('% real de Login')).toHaveValue(40)
    for (const shown of ['5.000,00', '4.000,00', '800,00', '-1.000,00', '1,25', '0,80', '8.000,00']) {
      expect(within(row).getByText(shown)).toBeInTheDocument()
    }
  })

  it('shows N/D with an explanation for indicators that could not be computed', async () => {
    backend.addActivity(projectId, { ...LOGIN, actual_cost: 0 })
    backend.indicators.set('Login', { cpi: null, eac: null, vac: null, spi: 0.8 })

    render(<ActivitiesTable projectId={projectId} />)

    const notAvailable = within(await findRow('Login')).getAllByText('N/D')
    expect(notAvailable).toHaveLength(3)
    expect(notAvailable[0]).toHaveAttribute('title', 'No disponible: la fórmula dividiría por cero.')
  })

  it('saves an edited row and refreshes the indicators from the backend', async () => {
    const login = backend.addActivity(projectId, LOGIN)
    backend.indicators.set('Login', { cpi: 1.25 })
    const user = userEvent.setup()
    render(<ActivitiesTable projectId={projectId} />)
    const save = within(await findRow('Login')).getByRole('button', { name: 'Guardar' })
    expect(save).toBeDisabled()

    const cost = screen.getByLabelText('AC de Login')
    await user.clear(cost)
    await user.type(cost, '5000')
    backend.indicators.set('Login', { cpi: 0.8 })
    await user.click(save)

    const path = `/projects/${String(projectId)}/activities/${String(login.id)}`
    expect(backend.requestsTo('PUT', path).map((r) => r.body)).toEqual([
      { ...LOGIN, actual_cost: 5000 },
    ])
    // The saved row remounts with fresh stored values, so look it up again after the reload.
    expect(await screen.findByText('0,80')).toBeInTheDocument()
    expect(within(await findRow('Login')).getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('rejects invalid values in Spanish without calling the backend', async () => {
    backend.addActivity(projectId, LOGIN)
    const user = userEvent.setup()
    render(<ActivitiesTable projectId={projectId} />)

    const bac = await screen.findByLabelText('BAC de Login')
    await user.clear(bac)
    await user.type(bac, '0')
    await user.click(within(await findRow('Login')).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El BAC debe ser mayor que cero.')
    expect(backend.requests.filter((r) => r.method === 'PUT')).toEqual([])
  })

  it('shows the backend message when the save is rejected', async () => {
    const login = backend.addActivity(projectId, LOGIN)
    const path = `/projects/${String(projectId)}/activities/${String(login.id)}`
    backend.failNext(
      'PUT',
      path,
      Response.json(
        { detail: [{ loc: ['body', 'bac'], msg: 'Decimal input should have no more than 2 decimal places' }] },
        { status: 422 },
      ),
    )
    const user = userEvent.setup()
    render(<ActivitiesTable projectId={projectId} />)

    const bac = await screen.findByLabelText('BAC de Login')
    await user.clear(bac)
    await user.type(bac, '10000.005')
    await user.click(within(await findRow('Login')).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'bac: Decimal input should have no more than 2 decimal places',
    )
  })

  it('adds an activity from the last row and clears it', async () => {
    const user = userEvent.setup()
    render(<ActivitiesTable projectId={projectId} />)
    expect(
      await screen.findByText(/Este proyecto aún no tiene actividades/),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nombre de la nueva actividad'), 'Reportes')
    await user.type(screen.getByLabelText('BAC de la nueva actividad'), '20000')
    await user.type(screen.getByLabelText('% planeado de la nueva actividad'), '25')
    await user.type(screen.getByLabelText('% real de la nueva actividad'), '50')
    await user.type(screen.getByLabelText('AC de la nueva actividad'), '12000')
    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    expect(backend.requestsTo('POST', `/projects/${String(projectId)}/activities`)[0]?.body).toEqual(
      { name: 'Reportes', bac: 20000, planned_percent: 25, actual_percent: 50, actual_cost: 12000 },
    )
    expect(await screen.findByLabelText('Nombre de Reportes')).toHaveValue('Reportes')
    expect(screen.getByLabelText('Nombre de la nueva actividad')).toHaveValue('')
  })

  it('deletes an activity only after confirmation', async () => {
    const login = backend.addActivity(projectId, LOGIN)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const user = userEvent.setup()
    render(<ActivitiesTable projectId={projectId} />)
    const path = `/projects/${String(projectId)}/activities/${String(login.id)}`

    await user.click(within(await findRow('Login')).getByRole('button', { name: 'Eliminar' }))
    expect(backend.requestsTo('DELETE', path)).toEqual([])

    await user.click(within(await findRow('Login')).getByRole('button', { name: 'Eliminar' }))
    expect(confirm).toHaveBeenLastCalledWith('¿Eliminar la actividad «Login»?')
    await waitFor(() => {
      expect(screen.queryByLabelText('Nombre de Login')).not.toBeInTheDocument()
    })
    expect(backend.requestsTo('DELETE', path)).toHaveLength(1)
  })

  it('reports a failed load', async () => {
    backend.failNext(
      'GET',
      `/projects/${String(projectId)}/evm`,
      Response.json({ detail: 'Database unavailable' }, { status: 503 }),
    )

    render(<ActivitiesTable projectId={projectId} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las actividades: Database unavailable',
    )
  })
})
