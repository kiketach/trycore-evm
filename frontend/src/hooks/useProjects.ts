import { listProjects } from '../api/projects'
import { useRemoteData } from './useRemoteData'

export function useProjects() {
  const { data, error, reload } = useRemoteData(listProjects)
  return { projects: data, error, reload }
}
