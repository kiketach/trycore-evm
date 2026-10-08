import { apiRequest, jsonBody } from './client'
import type { Project, ProjectWrite } from './types'

export function listProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects')
}

export function createProject(data: ProjectWrite): Promise<Project> {
  return apiRequest<Project>('/projects', jsonBody('POST', data))
}

export function updateProject(projectId: number, data: ProjectWrite): Promise<Project> {
  return apiRequest<Project>(`/projects/${String(projectId)}`, jsonBody('PUT', data))
}

export function deleteProject(projectId: number): Promise<void> {
  return apiRequest<undefined>(`/projects/${String(projectId)}`, { method: 'DELETE' })
}
