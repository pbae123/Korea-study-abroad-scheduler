import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useAppDispatch, useAppState } from './state/AppContext'
import { useResizableWidth } from './hooks/useResizableWidth'
import { CourseBank } from './components/CourseBank/CourseBank'
import { ScheduleGrid, SCHEDULE_DROP_ID } from './components/ScheduleGrid/ScheduleGrid'

function App() {
  const { classes, activeScheduleId } = useAppState()
  const dispatch = useAppDispatch()
  const [draggingClassId, setDraggingClassId] = useState<string | null>(null)
  const {
    width: courseBankWidth,
    handlePointerDown: handleResizePointerDown,
    handlePointerMove: handleResizePointerMove,
    handlePointerUp: handleResizePointerUp,
  } = useResizableWidth({ storageKey: 'courseBank', defaultWidth: 320, minWidth: 200, maxWidth: 640 })

  // Small activation distance so clicks on card buttons don't start a drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingClassId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingClassId(null)
    // Dropping anywhere on the grid panel adds to the active schedule;
    // drop position is intentionally not read (CONTEXT.md "Placement")
    if (event.over?.id === SCHEDULE_DROP_ID) {
      dispatch({
        type: 'PLACE_CLASS',
        scheduleId: activeScheduleId,
        classId: String(event.active.id),
      })
    }
  }

  const draggingClass = classes.find((c) => c.id === draggingClassId)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-white text-gray-900">
        <CourseBank width={courseBankWidth} />
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className="w-1 shrink-0 cursor-col-resize touch-none bg-gray-200 hover:bg-gray-400 active:bg-gray-500"
        />
        <ScheduleGrid />
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingClass && (
          <div className="rounded border border-gray-400 bg-white px-3 py-2 text-sm shadow-lg">
            {draggingClass.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default App
