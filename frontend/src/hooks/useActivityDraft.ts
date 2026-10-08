import { useState } from 'react'
import { errorMessage } from '../api/client'
import type { ActivityWrite } from '../api/types'
import {
  type ActivityDraft,
  type ActivityField,
  toActivityWrite,
  validateDraft,
} from '../activities/draft'

// Editing state shared by existing rows and the "new activity" row.
export function useActivityDraft(initial: ActivityDraft) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function setField(field: ActivityField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function run(action: () => Promise<void>): Promise<boolean> {
    setBusy(true)
    try {
      await action()
      setError(null)
      return true
    } catch (caught) {
      setError(errorMessage(caught))
      return false
    } finally {
      setBusy(false)
    }
  }

  function submit(save: (data: ActivityWrite) => Promise<void>): Promise<boolean> {
    const invalid = validateDraft(draft)
    if (invalid !== null) {
      setError(invalid)
      return Promise.resolve(false)
    }
    return run(() => save(toActivityWrite(draft)))
  }

  return { draft, setDraft, setField, error, busy, submit, run }
}
