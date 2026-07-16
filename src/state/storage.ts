import type { AppState, Class, MeetingBlock } from '../types'

const STORAGE_KEY = 'ksas:v1'

export const DEFAULT_GRID_AXIS = {
  startMinutes: 9 * 60,
  endMinutes: 19 * 60,
  intervalMinutes: 60,
}

export function createInitialState(): AppState {
  const scheduleId = crypto.randomUUID()
  return {
    classes: [],
    schedules: [{ id: scheduleId, name: 'Option 1', classIds: [] }],
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
    // Grid axis is a code-defined visual setting with no in-app editor;
    // always use the current default so axis changes reach existing users
    return {
      ...parsed,
      classes: migrateClasses(parsed.classes),
      gridAxis: DEFAULT_GRID_AXIS,
    }
  } catch {
    return createInitialState()
  }
}

function migrateClasses(classes: Class[]): Class[] {
  return classes.map((cls) => {
    const legacy = cls as Class & { timeBlock?: MeetingBlock }
    if (Array.isArray(cls.meetingBlocks)) return cls
    return {
      ...cls,
      meetingBlocks: legacy.timeBlock ? [legacy.timeBlock] : [],
    }
  })
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
