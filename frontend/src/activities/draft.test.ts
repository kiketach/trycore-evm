import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT, isSameDraft, toActivityWrite, toDraft, validateDraft } from './draft'

const VALID = {
  name: ' Login ',
  bac: '10000',
  planned_percent: '50',
  actual_percent: '40',
  actual_cost: '3200',
}

describe('activity drafts', () => {
  it('converts a draft into the API body with numbers and a trimmed name', () => {
    expect(toActivityWrite(VALID)).toEqual({
      name: 'Login',
      bac: 10000,
      planned_percent: 50,
      actual_percent: 40,
      actual_cost: 3200,
    })
  })

  it('round-trips an activity through its draft', () => {
    const activity = toActivityWrite(VALID)

    expect(toActivityWrite(toDraft(activity))).toEqual(activity)
  })

  it('compares drafts field by field', () => {
    expect(isSameDraft(VALID, { ...VALID })).toBe(true)
    expect(isSameDraft(VALID, { ...VALID, actual_cost: '3300' })).toBe(false)
  })

  it.each([
    [EMPTY_DRAFT, 'El nombre es obligatorio.'],
    [{ ...VALID, bac: '' }, 'BAC debe ser un número.'],
    [{ ...VALID, actual_percent: 'abc' }, '% real debe ser un número.'],
    [{ ...VALID, bac: '0' }, 'El BAC debe ser mayor que cero.'],
    [{ ...VALID, planned_percent: '101' }, '% planeado debe estar entre 0 y 100.'],
    [{ ...VALID, actual_percent: '-1' }, '% real debe estar entre 0 y 100.'],
    [{ ...VALID, actual_cost: '-0.01' }, 'El AC no puede ser negativo.'],
  ])('rejects %o with a Spanish message', (draft, message) => {
    expect(validateDraft(draft)).toBe(message)
  })

  it('accepts the boundaries and a cost above the budget', () => {
    expect(
      validateDraft({ ...VALID, planned_percent: '0', actual_percent: '100', actual_cost: '15000' }),
    ).toBeNull()
  })
})
