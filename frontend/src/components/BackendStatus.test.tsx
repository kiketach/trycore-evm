import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BackendStatus } from './BackendStatus'

function stubFetch(result: Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => result),
  )
}

describe('BackendStatus', () => {
  it('shows that it is checking while the request is pending', () => {
    stubFetch(new Promise<Response>(() => undefined))

    render(<BackendStatus />)

    expect(screen.getByText('Verificando conexión con el backend…')).toBeInTheDocument()
  })

  it('shows connected when the health check answers', async () => {
    stubFetch(Promise.resolve(Response.json({ status: 'ok' })))

    render(<BackendStatus />)

    expect(await screen.findByText('Conectado al backend')).toBeInTheDocument()
  })

  it('shows the backend error when the database is down', async () => {
    stubFetch(Promise.resolve(Response.json({ detail: 'Database unavailable' }, { status: 503 })))

    render(<BackendStatus />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sin conexión con el backend: Database unavailable',
    )
  })

  it('shows a network error when the backend is not running', async () => {
    stubFetch(Promise.reject(new TypeError('Failed to fetch')))

    render(<BackendStatus />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sin conexión con el backend: No se pudo conectar con el servidor.',
    )
  })
})
