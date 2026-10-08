import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../api/client'

// Loads data on mount and on demand. A response that arrives after unmount, or after a
// newer request, is ignored, so a slow answer never overwrites a fresher one.
export function useRemoteData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState(0)

  const reload = useCallback(() => {
    setRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    let current = true
    load()
      .then((result) => {
        if (current) {
          setData(result)
          setError(null)
        }
      })
      .catch((caught: unknown) => {
        if (current) setError(errorMessage(caught))
      })
    return () => {
      current = false
    }
  }, [load, requestId])

  return { data, error, reload }
}
