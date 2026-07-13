import type { Class, Day, GridAxis } from '../../types'
import { ALL_DAYS } from '../../types'
import { findConflictingClassIds, formatTimeRange, minutesToTime, timeToMinutes } from '../../utils/time'
import { layoutDayBlocks } from '../../utils/layout'

// Fixed v1 block fill; the Color field is deferred (CONTEXT.md "Color")
const BLOCK_FILL = '#FFFCF0'
const PX_PER_MINUTE = 1
// Yonsei-style class periods: each numbered row is a 50-minute period
const PERIOD_MINUTES = 50

interface GridCanvasProps {
  placedClasses: Class[]
  gridAxis: GridAxis
  onRemoveClass: (classId: string) => void
}

export function GridCanvas({ placedClasses, gridAxis, onRemoveClass }: GridCanvasProps) {
  const { startMinutes, endMinutes, intervalMinutes } = gridAxis
  const canvasHeight = (endMinutes - startMinutes) * PX_PER_MINUTE

  const scheduled = placedClasses.filter((c) => c.timeBlock)

  // Weekdays always shown; weekend columns appear only when a placed class uses them
  const usedDays = new Set(scheduled.flatMap((c) => c.timeBlock?.days ?? []))
  const days = ALL_DAYS.filter(
    (day) => !['Sat', 'Sun'].includes(day) || usedDays.has(day),
  )

  const rowStarts: number[] = []
  for (let t = startMinutes; t < endMinutes; t += intervalMinutes) rowStarts.push(t)

  const blocksForDay = (day: Day) => scheduled.filter((c) => c.timeBlock!.days.includes(day))

  return (
    <div className="flex-1 overflow-auto bg-white p-3">
      <div className="flex min-w-[640px]">
        {/* Time axis: a visual reference only — blocks position by actual clock time */}
        <div className="w-24 shrink-0">
          <div className="h-7" />
          <div className="relative" style={{ height: canvasHeight }}>
            {rowStarts.map((minutes, index) => (
              <div
                key={minutes}
                className="absolute right-2 text-[10px] text-gray-400"
                style={{ top: (minutes - startMinutes) * PX_PER_MINUTE }}
              >
                ({index + 1}) {minutesToTime(minutes)}-{minutesToTime(minutes + PERIOD_MINUTES)}
              </div>
            ))}
          </div>
        </div>

        {days.map((day) => {
          const dayBlocks = blocksForDay(day)
          // Conflicts and column layout are evaluated per day, so a class is
          // only flagged (and shrunk) on days where the overlap actually occurs
          const dayConflicts = findConflictingClassIds(dayBlocks)
          const dayLayouts = layoutDayBlocks(dayBlocks)
          return (
          <div key={day} className="min-w-0 flex-1 border-l border-gray-100">
            <div className="flex h-7 items-center justify-center text-xs font-medium text-gray-600">
              {day}
            </div>
            <div className="relative" style={{ height: canvasHeight }}>
              {rowStarts.map((minutes) => (
                <div
                  key={minutes}
                  className="absolute inset-x-0 border-t border-gray-100"
                  style={{ top: (minutes - startMinutes) * PX_PER_MINUTE }}
                />
              ))}
              {dayBlocks.map((cls) => {
                const block = cls.timeBlock!
                const top = (timeToMinutes(block.start) - startMinutes) * PX_PER_MINUTE
                const height = (timeToMinutes(block.end) - timeToMinutes(block.start)) * PX_PER_MINUTE
                const isConflicting = dayConflicts.has(cls.id)
                const layout = dayLayouts.get(cls.id) ?? { column: 0, columnCount: 1 }
                const widthPercent = 100 / layout.columnCount
                return (
                  <div
                    key={cls.id}
                    className={`group absolute overflow-hidden rounded border px-1.5 py-1 text-[11px] leading-tight ${
                      isConflicting ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'
                    }`}
                    style={{
                      top,
                      height,
                      backgroundColor: BLOCK_FILL,
                      left: `${layout.column * widthPercent}%`,
                      width: `calc(${widthPercent}% - 2px)`,
                    }}
                    title={
                      isConflicting
                        ? `${cls.name} — conflicts with another class on this schedule`
                        : cls.name
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onRemoveClass(cls.id)}
                      title="Remove from this schedule"
                      className="absolute right-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-black/5 hover:text-gray-700 group-hover:flex"
                    >
                      ×
                    </button>
                    <p className="truncate font-medium text-gray-900">{cls.name}</p>
                    <p className="truncate text-gray-500">{formatTimeRange(block.start, block.end)}</p>
                    {cls.location && <p className="truncate text-gray-500">{cls.location}</p>}
                    {isConflicting && <p className="font-medium text-red-600">conflict</p>}
                  </div>
                )
              })}
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
