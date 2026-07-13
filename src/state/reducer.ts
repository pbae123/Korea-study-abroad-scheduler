import type { AppState, Class, Schedule } from '../types'

export type Action =
  | { type: 'ADD_CLASS'; class: Class }
  | { type: 'UPDATE_CLASS'; class: Class }
  | { type: 'DELETE_CLASS'; classId: string }
  | { type: 'ADD_SCHEDULE'; schedule: Schedule }
  | { type: 'RENAME_SCHEDULE'; scheduleId: string; name: string }
  | { type: 'DELETE_SCHEDULE'; scheduleId: string }
  | { type: 'DUPLICATE_SCHEDULE'; scheduleId: string; newSchedule: Schedule }
  | { type: 'SET_ACTIVE_SCHEDULE'; scheduleId: string }
  | { type: 'PLACE_CLASS'; scheduleId: string; classId: string }
  | { type: 'REMOVE_PLACEMENT'; scheduleId: string; classId: string }

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.class] }

    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map((c) => (c.id === action.class.id ? action.class : c)),
      }

    // Cascade-removes the class from every schedule (ADR-0001)
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter((c) => c.id !== action.classId),
        schedules: state.schedules.map((s) => ({
          ...s,
          classIds: s.classIds.filter((id) => id !== action.classId),
        })),
      }

    case 'ADD_SCHEDULE':
      return {
        ...state,
        schedules: [...state.schedules, action.schedule],
        activeScheduleId: action.schedule.id,
      }

    case 'RENAME_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map((s) =>
          s.id === action.scheduleId ? { ...s, name: action.name } : s,
        ),
      }

    // The last remaining schedule cannot be deleted (CONTEXT.md "Schedule")
    case 'DELETE_SCHEDULE': {
      if (state.schedules.length <= 1) return state
      const remaining = state.schedules.filter((s) => s.id !== action.scheduleId)
      const activeScheduleId =
        state.activeScheduleId === action.scheduleId ? remaining[0].id : state.activeScheduleId
      return { ...state, schedules: remaining, activeScheduleId }
    }

    case 'DUPLICATE_SCHEDULE':
      return {
        ...state,
        schedules: [...state.schedules, action.newSchedule],
        activeScheduleId: action.newSchedule.id,
      }

    case 'SET_ACTIVE_SCHEDULE':
      return { ...state, activeScheduleId: action.scheduleId }

    case 'PLACE_CLASS': {
      return {
        ...state,
        schedules: state.schedules.map((s) => {
          if (s.id !== action.scheduleId) return s
          if (s.classIds.includes(action.classId)) return s
          return { ...s, classIds: [...s.classIds, action.classId] }
        }),
      }
    }

    case 'REMOVE_PLACEMENT':
      return {
        ...state,
        schedules: state.schedules.map((s) =>
          s.id === action.scheduleId
            ? { ...s, classIds: s.classIds.filter((id) => id !== action.classId) }
            : s,
        ),
      }

    default:
      return state
  }
}
