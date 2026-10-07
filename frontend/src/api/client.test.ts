import { describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, NETWORK_ERROR_STATUS } from './client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((caught: unknown) => caught)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe('apiRequest', () => {
  it('prefixes the path with /api and returns the parsed body', async () => {
    const fetchMock = stubFetch(jsonResponse(200, { status: 'ok' }))

    await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything())
  })

  it('sends JSON bodies with a JSON content type', async () => {
    const fetchMock = stubFetch(jsonResponse(201, { id: 1 }))

    await apiRequest('/projects', { method: 'POST', body: JSON.stringify({ name: 'Demo' }) })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for 204 No Content', async () => {
    stubFetch(new Response(null, { status: 204 }))

    await expect(apiRequest('/projects/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('uses the backend detail message for handled errors', async () => {
    stubFetch(jsonResponse(404, { detail: 'Project 7 not found' }))

    const error = await captureError(apiRequest('/projects/7'))

    expect(error.status).toBe(404)
    expect(error.message).toBe('Project 7 not found')
  })

  it('joins validation issues by field for 422 responses', async () => {
    stubFetch(
      jsonResponse(422, {
        detail: [
          { loc: ['body', 'bac'], msg: 'Input should be greater than 0' },
          { loc: ['body', 'actual_percent'], msg: 'Input should be less than or equal to 100' },
        ],
      }),
    )

    const error = await captureError(apiRequest('/projects/1/activities'))

    expect(error.status).toBe(422)
    expect(error.message).toBe(
      'bac: Input should be greater than 0; actual_percent: Input should be less than or equal to 100',
    )
  })

  it('falls back to the status code when the error body is not JSON', async () => {
    stubFetch(new Response('Bad gateway', { status: 502 }))

    const error = await captureError(apiRequest('/health'))

    expect(error.status).toBe(502)
    expect(error.message).toBe('Error 502')
  })

  it('reports an unreachable server as a network error', async () => {
    stubFetch(new TypeError('Failed to fetch'))

    const error = await captureError(apiRequest('/health'))

    expect(error.status).toBe(NETWORK_ERROR_STATUS)
    expect(error.message).toBe('No se pudo conectar con el servidor.')
  })
})
