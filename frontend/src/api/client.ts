// Relative to the page: the Vite dev server proxies /api to the FastAPI backend.
const API_BASE = '/api'
const NO_CONTENT = 204
export const NETWORK_ERROR_STATUS = 0
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor.'

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function jsonBody(method: 'POST' | 'PUT', data: unknown): RequestInit {
  return { method, body: JSON.stringify(data) }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  if (response.status === NO_CONTENT) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Error ${response.status}`
  try {
    const body: unknown = await response.json()
    return describeDetail(body) ?? fallback
  } catch {
    return fallback
  }
}

// FastAPI sends {"detail": "text"} for handled errors and {"detail": [issues]} for 422.
function describeDetail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) {
    return null
  }
  const { detail } = body
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return (detail as ValidationIssue[])
      .map((issue) => `${String(issue.loc.at(-1))}: ${issue.msg}`)
      .join('; ')
  }
  return null
}
