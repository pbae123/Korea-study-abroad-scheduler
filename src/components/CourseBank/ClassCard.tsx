import { useDraggable } from '@dnd-kit/core'
import type { Class } from '../../types'
import { formatTimeRange } from '../../utils/time'

interface ClassCardProps {
  cls: Class
  isPlacedOnActiveSchedule: boolean
  onAdd: () => void
  onRemove: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ClassCard({
  cls,
  isPlacedOnActiveSchedule,
  onAdd,
  onRemove,
  onEdit,
  onDelete,
}: ClassCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cls.id,
    disabled: isPlacedOnActiveSchedule,
  })

  const metaParts = [cls.courseCode, cls.instructor, cls.location].filter(Boolean)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // dnd-kit marks the disabled draggable aria-disabled, which screen
      // readers extend to the card's still-functional buttons — strip it
      aria-disabled={undefined}
      className={`group rounded-md border border-gray-200 bg-white p-3 shadow-sm transition-opacity ${
        isDragging ? 'opacity-40' : ''
      } ${isPlacedOnActiveSchedule ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{cls.name}</p>
          {metaParts.length > 0 && (
            <p className="truncate text-xs text-gray-500">{metaParts.join(' · ')}</p>
          )}
          {cls.timeBlock ? (
            <p className="text-xs text-gray-500">
              {cls.timeBlock.days.join('/')} {formatTimeRange(cls.timeBlock.start, cls.timeBlock.end)}
            </p>
          ) : (
            <p className="text-xs italic text-gray-400">no set time</p>
          )}
          {cls.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {cls.tags.map((tag) => (
                <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.625rem] text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isPlacedOnActiveSchedule ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              // Stop dnd-kit's pointer listener from swallowing the click
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded border border-gray-900 bg-gray-900 px-2 py-0.5 text-xs text-white hover:bg-gray-700"
            >
              Add
            </button>
          )}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
