import { apiRequest } from './client'
import type { Health } from './types'

export function getHealth(): Promise<Health> {
  return apiRequest<Health>('/health')
}
