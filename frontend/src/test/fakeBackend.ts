import { vi } from 'vitest'
import type { Activity, ActivityWrite, EvmIndicators, Project, ProjectWrite } from '../api/types'

// In-memory stand-in for the FastAPI routes the UI uses. It stores what it receives and
// records every request; it never computes EVM: tests choose the indicators it returns.

interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

const NOT_COMPUTED: EvmIndicators = {
  bac: 0, pv: 0, ev: 0, ac: 0, cv: 0, sv: 0,
  cpi: null, spi: null, cpi_exact: null, spi_exact: null, eac: null, vac: null,
  cost_status: 'NOT_AVAILABLE', schedule_status: 'NOT_AVAILABLE',
}  // prettier-ignore

const TIMESTAMP = '2026-10-07T12:00:00Z'

export class FakeBackend {
  projects: Project[] = []
  activities: Activity[] = []
  requests: RecordedRequest[] = []
  // Indicators returned by GET /projects/{id}/evm, by activity name.
  indicators = new Map<string, Partial<EvmIndicators>>()
  private nextId = 1
  private version = 0
  private failures: { method: string; path: string; response: Response }[] = []

  addProject(data: ProjectWrite): Project {
    const project: Project = {
      id: this.nextId++,
      name: data.name,
      description: data.description ?? null,
      cutoff_date: data.cutoff_date ?? null,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    }
    this.projects.push(project)
    return project
  }

  addActivity(projectId: number, data: ActivityWrite): Activity {
    const activity: Activity = {
      ...data,
      id: this.nextId++,
      project_id: projectId,
      created_at: TIMESTAMP,
      updated_at: this.stamp(),
    }
    this.activities.push(activity)
    return activity
  }

  failNext(method: string, path: string, response: Response) {
    this.failures.push({ method, path, response })
  }

  requestsTo(method: string, path: string): RecordedRequest[] {
    return this.requests.filter((r) => r.method === method && r.path === path)
  }

  handle(method: string, path: string, body: unknown): Response {
    this.requests.push({ method, path, body })
    const failure = this.failures.findIndex((f) => f.method === method && f.path === path)
    if (failure !== -1) {
      return this.failures.splice(failure, 1)[0].response
    }
    const [, resource, projectPart, child, childPart] = path.split('/')
    const projectId = Number(projectPart)
    if (resource === 'health') return Response.json({ status: 'ok' })
    if (resource !== 'projects') return notFound()
    if (projectPart === undefined) return this.projectsCollection(method, body)
    if (child === undefined) return this.projectItem(method, projectId, body)
    if (child === 'evm') return this.evm(projectId)
    if (childPart === undefined) return this.activitiesCollection(method, projectId, body)
    return this.activityItem(method, projectId, Number(childPart), body)
  }

  private projectsCollection(method: string, body: unknown): Response {
    if (method === 'GET') return Response.json(this.projects)
    return Response.json(this.addProject(body as ProjectWrite), { status: 201 })
  }

  private projectItem(method: string, projectId: number, body: unknown): Response {
    const project = this.projects.find((p) => p.id === projectId)
    if (project === undefined) return notFound()
    if (method === 'DELETE') {
      this.projects = this.projects.filter((p) => p.id !== projectId)
      this.activities = this.activities.filter((a) => a.project_id !== projectId)
      return new Response(null, { status: 204 })
    }
    Object.assign(project, body, { updated_at: this.stamp() })
    return Response.json(project)
  }

  private activitiesCollection(method: string, projectId: number, body: unknown): Response {
    if (method === 'GET') {
      return Response.json(this.activities.filter((a) => a.project_id === projectId))
    }
    return Response.json(this.addActivity(projectId, body as ActivityWrite), { status: 201 })
  }

  private activityItem(
    method: string,
    projectId: number,
    activityId: number,
    body: unknown,
  ): Response {
    const activity = this.activities.find((a) => a.id === activityId && a.project_id === projectId)
    if (activity === undefined) return notFound()
    if (method === 'DELETE') {
      this.activities = this.activities.filter((a) => a.id !== activityId)
      return new Response(null, { status: 204 })
    }
    Object.assign(activity, body, { updated_at: this.stamp() })
    return Response.json(activity)
  }

  private evm(projectId: number): Response {
    const project = this.projects.find((p) => p.id === projectId)
    if (project === undefined) return notFound()
    return Response.json({
      project_id: project.id,
      project_name: project.name,
      cutoff_date: project.cutoff_date,
      summary: NOT_COMPUTED,
      activities: this.activities
        .filter((a) => a.project_id === projectId)
        .map((a) => ({
          activity_id: a.id,
          name: a.name,
          ...NOT_COMPUTED,
          ...this.indicators.get(a.name),
        })),
    })
  }

  private stamp(): string {
    this.version += 1
    return `2026-10-07T12:00:${String(this.version).padStart(2, '0')}Z`
  }
}

function notFound(): Response {
  return Response.json({ detail: 'Not found' }, { status: 404 })
}

export function installFakeBackend(): FakeBackend {
  const backend = new FakeBackend()
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const path = String(input).replace(/^\/api/, '')
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
      return Promise.resolve(backend.handle(init?.method ?? 'GET', path, body))
    }),
  )
  return backend
}
