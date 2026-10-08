import type { CostStatus, ScheduleStatus } from '../api/types'

// Two colours plus grey, no invented thresholds: the backend already decided the status
// from the exact index (D-06); this only says how to show it.
export type Tone = 'good' | 'bad' | 'neutral'

export interface StatusDisplay {
  label: string
  tone: Tone
}

export const TONE_ICON: Record<Tone, string> = { good: '✓', bad: '✕', neutral: '—' }

export const COST_STATUS: Record<CostStatus, StatusDisplay> = {
  UNDER_BUDGET: { label: 'Bajo presupuesto', tone: 'good' },
  ON_BUDGET: { label: 'En presupuesto', tone: 'good' },
  OVER_BUDGET: { label: 'Sobre presupuesto', tone: 'bad' },
  NOT_AVAILABLE: { label: 'No disponible', tone: 'neutral' },
}

export const SCHEDULE_STATUS: Record<ScheduleStatus, StatusDisplay> = {
  AHEAD: { label: 'Adelantado', tone: 'good' },
  ON_SCHEDULE: { label: 'A tiempo', tone: 'good' },
  BEHIND: { label: 'Atrasado', tone: 'bad' },
  NOT_AVAILABLE: { label: 'No disponible', tone: 'neutral' },
}

export function projectVerdict(cost: CostStatus, schedule: ScheduleStatus): string {
  if (cost === 'NOT_AVAILABLE' && schedule === 'NOT_AVAILABLE') {
    return 'Aún no hay datos suficientes para evaluar el proyecto.'
  }
  const costText = COST_STATUS[cost].label.toLowerCase()
  const scheduleText = SCHEDULE_STATUS[schedule].label.toLowerCase()
  return `Costo: ${costText}. Cronograma: ${scheduleText}.`
}
