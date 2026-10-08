import { describe, expect, it } from 'vitest'
import { COST_STATUS, projectVerdict, SCHEDULE_STATUS, verdictTone } from './status'

describe('status display', () => {
  it('uses green only for at-or-better-than-plan and red only for worse', () => {
    expect(COST_STATUS.UNDER_BUDGET.tone).toBe('good')
    expect(COST_STATUS.ON_BUDGET.tone).toBe('good')
    expect(COST_STATUS.OVER_BUDGET.tone).toBe('bad')
    expect(SCHEDULE_STATUS.AHEAD.tone).toBe('good')
    expect(SCHEDULE_STATUS.ON_SCHEDULE.tone).toBe('good')
    expect(SCHEDULE_STATUS.BEHIND.tone).toBe('bad')
  })

  it('shows grey when the backend could not compute the index', () => {
    expect(COST_STATUS.NOT_AVAILABLE).toEqual({ label: 'No disponible', tone: 'neutral' })
    expect(SCHEDULE_STATUS.NOT_AVAILABLE).toEqual({ label: 'No disponible', tone: 'neutral' })
  })

  it('summarizes the project in one sentence', () => {
    expect(projectVerdict('OVER_BUDGET', 'AHEAD')).toBe(
      'Costo: sobre presupuesto. Cronograma: adelantado.',
    )
    expect(projectVerdict('NOT_AVAILABLE', 'NOT_AVAILABLE')).toBe(
      'Aún no hay datos suficientes para evaluar el proyecto.',
    )
  })
})

describe('verdictTone', () => {
  it('warns as soon as cost or schedule is worse than planned', () => {
    expect(verdictTone('OVER_BUDGET', 'AHEAD')).toBe('bad')
    expect(verdictTone('UNDER_BUDGET', 'BEHIND')).toBe('bad')
  })

  it('is good only when nothing is worse than planned', () => {
    expect(verdictTone('ON_BUDGET', 'AHEAD')).toBe('good')
    expect(verdictTone('UNDER_BUDGET', 'NOT_AVAILABLE')).toBe('good')
  })

  it('is neutral when nothing can be evaluated', () => {
    expect(verdictTone('NOT_AVAILABLE', 'NOT_AVAILABLE')).toBe('neutral')
  })
})
