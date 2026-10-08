import { useCallback } from 'react'
import { listActivities } from '../api/activities'
import { getProjectEvm } from '../api/evm'
import type { Activity, ProjectEvm } from '../api/types'
import { useRemoteData } from './useRemoteData'

export interface ProjectActivities {
  activities: Activity[]
  evm: ProjectEvm
}

// Activities carry the editable inputs; the EVM endpoint carries the computed indicators.
// Both are reloaded together after every change, so the table never shows stale numbers.
export function useProjectActivities(projectId: number) {
  const load = useCallback(async (): Promise<ProjectActivities> => {
    const [activities, evm] = await Promise.all([
      listActivities(projectId),
      getProjectEvm(projectId),
    ])
    return { activities, evm }
  }, [projectId])

  return useRemoteData(load)
}
