import type { Class } from '../../types'

interface UnscheduledListProps {
  classes: Class[]
  onRemoveClass: (classId: string) => void
}

// Placed classes with no time block (async/online) live here instead of on the grid
export function UnscheduledList({ classes, onRemoveClass }: UnscheduledListProps) {
  if (classes.length === 0) return null

  return (
    <div className="border-t border-gray-200 px-3 py-2">
      <p className="mb-1 text-[0.625rem] font-medium uppercase tracking-wide text-gray-400">
        No set time
      </p>
      <div className="flex flex-wrap gap-1.5">
        {classes.map((cls) => (
          <span
            key={cls.id}
            className="flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
            style={{ backgroundColor: '#FFFCF0' }}
          >
            {cls.name}
            <button
              type="button"
              onClick={() => onRemoveClass(cls.id)}
              title="Remove from this schedule"
              className="text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
