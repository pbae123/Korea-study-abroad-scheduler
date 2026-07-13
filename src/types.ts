export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export const ALL_DAYS: readonly Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Every Class has meeting days and one time block using the fixed class periods.
export interface TimeBlock {
  days: Day[]
  start: string // "HH:MM" 24h clock time
  end: string // "HH:MM" 24h clock time
}

export interface Class {
  id: string
  name: string
  courseCode?: string
  school?: string
  credits?: string
  instructor?: string
  location?: string
  link?: string
  notes?: string
  tags: string[]
  timeBlock: TimeBlock
}

// Placements are live references: a Schedule stores only Class ids (ADR-0001)
export interface Schedule {
  id: string
  name: string
  classIds: string[]
}

// Global background time axis for the grid; purely visual (CONTEXT.md "Grid axis")
export interface GridAxis {
  startMinutes: number
  endMinutes: number
  intervalMinutes: number
}

export interface AppState {
  classes: Class[]
  schedules: Schedule[]
  activeScheduleId: string
  gridAxis: GridAxis
}
