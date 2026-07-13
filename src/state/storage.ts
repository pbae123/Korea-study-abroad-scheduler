import type { AppState } from '../types'

const STORAGE_KEY = 'ksas:v1'

export const DEFAULT_GRID_AXIS = {
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
  intervalMinutes: 60,
}

export function createInitialState(): AppState {
  const scheduleId = crypto.randomUUID()
  return {
    classes: [],
    schedules: [{ id: scheduleId, name: 'Option A', classIds: [] }],
    activeScheduleId: scheduleId,
    gridAxis: DEFAULT_GRID_AXIS,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidState(parsed)) return createInitialState()
    return parsed
  } catch {
    return createInitialState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable; app keeps working in-memory
  }
}

// Structural check on untrusted localStorage data before using it
function isValidState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Record<string, unknown>
  if (!Array.isArray(state.classes) || !Array.isArray(state.schedules)) return false
  if (typeof state.activeScheduleId !== 'string') return false
  if (typeof state.gridAxis !== 'object' || state.gridAxis === null) return false
  if (state.schedules.length === 0) return false
  return true
}
