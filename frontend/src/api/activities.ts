import { apiRequest, jsonBody } from './client'
import type { Activity, ActivityWrite } from './types'

function activitiesPath(projectId: number, activityId?: number): string {
  const base = `/projects/${String(projectId)}/activities`
  return activityId === undefined ? base : `${base}/${String(activityId)}`
}

export function listActivities(projectId: number): Promise<Activity[]> {
  return apiRequest<Activity[]>(activitiesPath(projectId))
}

export function createActivity(projectId: number, data: ActivityWrite): Promise<Activity> {
  return apiRequest<Activity>(activitiesPath(projectId), jsonBody('POST', data))
}

export function updateActivity(
  projectId: number,
  activityId: number,
  data: ActivityWrite,
): Promise<Activity> {
  return apiRequest<Activity>(activitiesPath(projectId, activityId), jsonBody('PUT', data))
}

export function deleteActivity(projectId: number, activityId: number): Promise<void> {
  return apiRequest<undefined>(activitiesPath(projectId, activityId), { method: 'DELETE' })
}
