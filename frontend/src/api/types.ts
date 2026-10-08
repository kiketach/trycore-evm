// Mirrors the backend contract published at /api-docs.

export type CostStatus = 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET' | 'NOT_AVAILABLE'
export type ScheduleStatus = 'AHEAD' | 'ON_SCHEDULE' | 'BEHIND' | 'NOT_AVAILABLE'

export interface Health {
  status: 'ok'
}

export interface Project {
  id: number
  name: string
  description: string | null
  cutoff_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectWrite {
  name: string
  description?: string | null
  cutoff_date?: string | null
}

export interface ActivityWrite {
  name: string
  bac: number
  planned_percent: number
  actual_percent: number
  actual_cost: number
}

export interface Activity extends ActivityWrite {
  id: number
  project_id: number
  created_at: string
  updated_at: string
}

export interface EvmIndicators {
  bac: number
  pv: number
  ev: number
  ac: number
  cv: number
  sv: number
  cpi: number | null
  spi: number | null
  cpi_exact: number | null
  spi_exact: number | null
  eac: number | null
  vac: number | null
  cost_status: CostStatus
  schedule_status: ScheduleStatus
}

export interface ActivityEvm extends EvmIndicators {
  activity_id: number
  name: string
}

export interface ProjectEvm {
  project_id: number
  project_name: string
  cutoff_date: string | null
  summary: EvmIndicators
  activities: ActivityEvm[]
}
