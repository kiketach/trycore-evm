import type { ActivityWrite } from '../api/types'

// Early feedback in Spanish only: the backend validates the same rules and is the authority.
const MIN_PERCENT = 0
const MAX_PERCENT = 100

export type ActivityField = keyof ActivityWrite
export type ActivityDraft = Record<ActivityField, string>

export const ACTIVITY_FIELDS: readonly ActivityField[] = [
  'name',
  'bac',
  'planned_percent',
  'actual_percent',
  'actual_cost',
]

export const FIELD_LABELS: Record<ActivityField, string> = {
  name: 'Nombre',
  bac: 'BAC',
  planned_percent: '% planeado',
  actual_percent: '% real',
  actual_cost: 'AC',
}

const NUMERIC_FIELDS: readonly Exclude<ActivityField, 'name'>[] = [
  'bac',
  'planned_percent',
  'actual_percent',
  'actual_cost',
]

export const EMPTY_DRAFT: ActivityDraft = {
  name: '',
  bac: '',
  planned_percent: '',
  actual_percent: '',
  actual_cost: '',
}

export function toDraft(activity: ActivityWrite): ActivityDraft {
  return {
    name: activity.name,
    bac: String(activity.bac),
    planned_percent: String(activity.planned_percent),
    actual_percent: String(activity.actual_percent),
    actual_cost: String(activity.actual_cost),
  }
}

export function toActivityWrite(draft: ActivityDraft): ActivityWrite {
  return {
    name: draft.name.trim(),
    bac: Number(draft.bac),
    planned_percent: Number(draft.planned_percent),
    actual_percent: Number(draft.actual_percent),
    actual_cost: Number(draft.actual_cost),
  }
}

export function isSameDraft(left: ActivityDraft, right: ActivityDraft): boolean {
  return ACTIVITY_FIELDS.every((field) => left[field] === right[field])
}

export function validateDraft(draft: ActivityDraft): string | null {
  if (draft.name.trim() === '') {
    return 'El nombre es obligatorio.'
  }
  const missing = NUMERIC_FIELDS.find(
    (field) => draft[field].trim() === '' || !Number.isFinite(Number(draft[field])),
  )
  if (missing !== undefined) {
    return `${FIELD_LABELS[missing]} debe ser un número.`
  }
  const values = toActivityWrite(draft)
  if (values.bac <= 0) {
    return 'El BAC debe ser mayor que cero.'
  }
  for (const field of ['planned_percent', 'actual_percent'] as const) {
    if (values[field] < MIN_PERCENT || values[field] > MAX_PERCENT) {
      return `${FIELD_LABELS[field]} debe estar entre ${String(MIN_PERCENT)} y ${String(MAX_PERCENT)}.`
    }
  }
  if (values.actual_cost < 0) {
    return 'El AC no puede ser negativo.'
  }
  return null
}
