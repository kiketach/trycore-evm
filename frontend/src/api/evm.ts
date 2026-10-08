import { apiRequest } from './client'
import type { ProjectEvm } from './types'

export function getProjectEvm(projectId: number): Promise<ProjectEvm> {
  return apiRequest<ProjectEvm>(`/projects/${String(projectId)}/evm`)
}
