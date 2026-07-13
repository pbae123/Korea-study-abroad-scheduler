import { useState } from 'react'
import type { Schedule } from '../../types'
import { useAppDispatch } from '../../state/AppContext'

interface ScheduleTabsProps {
  schedules: Schedule[]
  activeScheduleId: string
}

export function ScheduleTabs({ schedules, activeScheduleId }: ScheduleTabsProps) {
  const dispatch = useAppDispatch()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: 'RENAME_SCHEDULE', scheduleId: renamingId, name: renameValue.trim() })
    }
    setRenamingId(null)
  }

  const addSchedule = () => {
    dispatch({
      type: 'ADD_SCHEDULE',
      schedule: { id: crypto.randomUUID(), name: `Option ${schedules.length + 1}`, classIds: [] },
    })
  }

  const duplicateActive = () => {
    const active = schedules.find((s) => s.id === activeScheduleId)
    if (!active) return
    // Deep copy of placements under a new name (CONTEXT.md "Schedule")
    dispatch({
      type: 'DUPLICATE_SCHEDULE',
      scheduleId: active.id,
      newSchedule: {
        id: crypto.randomUUID(),
        name: `${active.name} (copy)`,
        classIds: [...active.classIds],
      },
    })
  }

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 px-3 pt-2">
      {schedules.map((schedule) => {
        const isActive = schedule.id === activeScheduleId
        return renamingId === schedule.id ? (
          <input
            key={schedule.id}
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setRenamingId(null)
            }}
            className="w-28 rounded-t border border-b-0 border-gray-300 px-2 py-1 text-xs focus:outline-none"
          />
        ) : (
          <button
            key={schedule.id}
            type="button"
            onClick={() => dispatch({ type: 'SET_ACTIVE_SCHEDULE', scheduleId: schedule.id })}
            onDoubleClick={() => {
              setRenamingId(schedule.id)
              setRenameValue(schedule.name)
            }}
            title="Double-click to rename"
            className={`rounded-t border border-b-0 px-3 py-1 text-xs ${
              isActive
                ? 'border-gray-300 bg-white font-medium text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {schedule.name}
          </button>
        )
      })}
      <button
        type="button"
        onClick={addSchedule}
        title="New schedule"
        className="px-2 py-1 text-xs text-gray-400 hover:text-gray-800"
      >
        +
      </button>
      <div className="ml-auto flex items-center gap-2 pb-1">
        <button
          type="button"
          onClick={duplicateActive}
          className="text-xs text-gray-400 hover:text-gray-800"
        >
          duplicate
        </button>
        {schedules.length > 1 && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'DELETE_SCHEDULE', scheduleId: activeScheduleId })}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            delete
          </button>
        )}
      </div>
    </div>
  )
}
