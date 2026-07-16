import { useDroppable } from '@dnd-kit/core'
import { useAppDispatch, useAppState } from '../../state/AppContext'
import { ScheduleTabs } from './ScheduleTabs'
import { GridCanvas } from './GridCanvas'
import { UnscheduledList } from './UnscheduledList'

export const SCHEDULE_DROP_ID = 'schedule-grid'

export function ScheduleGrid() {
  const { classes, schedules, activeScheduleId, gridAxis } = useAppState()
  const dispatch = useAppDispatch()

  // The whole panel is one drop target: dropping adds to the active schedule,
  // drop position is never read as data (CONTEXT.md "Placement")
  const { setNodeRef, isOver } = useDroppable({ id: SCHEDULE_DROP_ID })

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId)
  const placedClasses = (activeSchedule?.classIds ?? [])
    .map((id) => classes.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  const unscheduled = placedClasses.filter((c) => c.meetingBlocks.length === 0)

  const removeClass = (classId: string) =>
    dispatch({ type: 'REMOVE_PLACEMENT', scheduleId: activeScheduleId, classId })

  return (
    <main
      ref={setNodeRef}
      className={`flex h-full min-w-0 flex-1 flex-col transition-colors ${
        isOver ? 'bg-blue-50/50' : ''
      }`}
    >
      <ScheduleTabs schedules={schedules} activeScheduleId={activeScheduleId} />
      <GridCanvas placedClasses={placedClasses} gridAxis={gridAxis} onRemoveClass={removeClass} />
      <UnscheduledList classes={unscheduled} onRemoveClass={removeClass} />
    </main>
  )
}
