import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { Schedule } from '../../types'
import { useAppDispatch } from '../../state/AppContext'
import { TEXT_SIZES } from '../../config/textSizes'

interface ScheduleTabsProps {
  schedules: Schedule[]
  activeScheduleId: string
}

// Next free "Option N" number so closing tabs never produces duplicate names
function nextOptionName(schedules: Schedule[]): string {
  const usedNumbers = schedules
    .map((s) => /^Option (\d+)$/.exec(s.name)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
  let next = 1
  while (usedNumbers.includes(next)) next++
  return `Option ${next}`
}

export function ScheduleTabs({ schedules, activeScheduleId }: ScheduleTabsProps) {
  const dispatch = useAppDispatch()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [draggedScheduleId, setDraggedScheduleId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{
    targetScheduleId: string
    placeAfter: boolean
  } | null>(null)
  const didDrag = useRef(false)

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: 'RENAME_SCHEDULE', scheduleId: renamingId, name: renameValue.trim() })
    }
    setRenamingId(null)
  }

  const addSchedule = () => {
    dispatch({
      type: 'ADD_SCHEDULE',
      schedule: { id: crypto.randomUUID(), name: nextOptionName(schedules), classIds: [] },
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

  const handleDragStart = (event: DragEvent<HTMLDivElement>, scheduleId: string) => {
    didDrag.current = false
    setDraggedScheduleId(scheduleId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', scheduleId)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetScheduleId: string) => {
    event.preventDefault()
    const sourceScheduleId = draggedScheduleId ?? event.dataTransfer.getData('text/plain')
    setDropIndicator(null)
    if (!sourceScheduleId || sourceScheduleId === targetScheduleId) return

    const bounds = event.currentTarget.getBoundingClientRect()
    didDrag.current = true
    dispatch({
      type: 'REORDER_SCHEDULES',
      sourceScheduleId,
      targetScheduleId,
      placeAfter: event.clientX > bounds.left + bounds.width / 2,
    })
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetScheduleId: string) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const sourceScheduleId = draggedScheduleId ?? event.dataTransfer.getData('text/plain')
    if (!sourceScheduleId || sourceScheduleId === targetScheduleId) {
      setDropIndicator(null)
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const placeAfter = event.clientX > bounds.left + bounds.width / 2
    setDropIndicator((current) =>
      current?.targetScheduleId === targetScheduleId && current.placeAfter === placeAfter
        ? current
        : { targetScheduleId, placeAfter },
    )
  }

  return (
    <div className="flex items-end gap-1 border-b border-gray-300 bg-gray-100 px-3 pt-4">
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
            className="-mb-px w-32 rounded-t-lg border border-b-0 border-gray-300 bg-white px-3 py-1.5 focus:outline-none"
            style={{ fontSize: `${TEXT_SIZES.scheduleTabLabel}rem` }}
          />
        ) : (
          // Browser-style tab: outlined, rounded top, active tab merges into the
          // white content area below (border-b hidden via -mb-px + white bg)
          <div
            key={schedule.id}
            draggable
            onDragStart={(event) => handleDragStart(event, schedule.id)}
            onDragEnd={() => {
              setDraggedScheduleId(null)
              setDropIndicator(null)
            }}
            onDragOver={(event) => handleDragOver(event, schedule.id)}
            onDrop={(event) => handleDrop(event, schedule.id)}
            onClick={() => {
              if (!didDrag.current) dispatch({ type: 'SET_ACTIVE_SCHEDULE', scheduleId: schedule.id })
              didDrag.current = false
            }}
            onDoubleClick={() => {
              setRenamingId(schedule.id)
              setRenameValue(schedule.name)
            }}
            title="Double-click to rename"
            className={`relative -mb-px flex cursor-grab select-none items-center gap-2 rounded-t-lg border px-3 py-1.5 active:cursor-grabbing ${
              draggedScheduleId === schedule.id ? 'opacity-50 ' : ''
            }${isActive
                ? 'border-gray-300 border-b-white bg-white font-medium text-gray-900'
                : 'border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
            }`}
            style={{ fontSize: `${TEXT_SIZES.scheduleTabLabel}rem` }}
          >
            {dropIndicator?.targetScheduleId === schedule.id && (
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 z-10 w-0.5 rounded bg-blue-500 ${
                  dropIndicator.placeAfter ? '-right-1' : '-left-1'
                }`}
              />
            )}
            <span className="max-w-32 truncate">{schedule.name}</span>
            {schedules.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  // Close this tab without also selecting it
                  e.stopPropagation()
                  dispatch({ type: 'DELETE_SCHEDULE', scheduleId: schedule.id })
                }}
                title={`Close ${schedule.name}`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-300 hover:text-gray-800"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={addSchedule}
        title="New schedule"
        className="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900"
      >
        +
      </button>
      <div className="ml-auto pb-1.5">
        <button
          type="button"
          onClick={duplicateActive}
          className="text-xs text-gray-400 hover:text-gray-800"
        >
          duplicate
        </button>
      </div>
    </div>
  )
}
