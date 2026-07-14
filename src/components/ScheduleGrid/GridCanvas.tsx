import type { Class, Day, GridAxis } from '../../types'
import { ALL_DAYS } from '../../types'
import { findConflictingClassIds, formatTimeRange, minutesToTime, timeToMinutes } from '../../utils/time'
import { layoutDayBlocks } from '../../utils/layout'
import { TEXT_SIZES } from '../../config/textSizes'

// Fixed v1 block fill; the Color field is deferred (CONTEXT.md "Color")
const BLOCK_FILL = '#FFFCF0'
// Yonsei-style class periods: each numbered row is a 50-minute period
const PERIOD_MINUTES = 50

interface GridCanvasProps {
  placedClasses: Class[]
  gridAxis: GridAxis
  onRemoveClass: (classId: string) => void
}

export function GridCanvas({ placedClasses, gridAxis, onRemoveClass }: GridCanvasProps) {
  const { startMinutes, endMinutes, intervalMinutes } = gridAxis

  // Percentage-based vertical layout: the grid stretches to fill the panel,
  // so it adapts to window size and browser zoom with no blank space below
  const axisSpan = endMinutes - startMinutes
  const toPercent = (minutes: number) => ((minutes - startMinutes) / axisSpan) * 100

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
    <div className="flex flex-1 overflow-auto bg-white p-3">
      <div className="flex min-h-[480px] w-full min-w-[640px]">
        {/* Time axis: a visual reference only — blocks position by actual clock time */}
        <div className="flex w-28 shrink-0 flex-col">
          <div className="h-7 shrink-0" />
          <div className="relative flex-1">
            {rowStarts.map((minutes, index) => (
              <div
                key={minutes}
                className="absolute right-2 whitespace-nowrap text-gray-400"
                style={{ top: `${toPercent(minutes)}%`, fontSize: `${TEXT_SIZES.yAxisTimeLabel}rem` }}
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
          <div key={day} className="flex min-w-0 flex-1 flex-col border-l border-gray-100">
            <div
              className="flex h-7 shrink-0 items-center justify-center font-medium text-gray-600"
              style={{ fontSize: `${TEXT_SIZES.dayOfWeekHeader}rem` }}
            >
              {day}
            </div>
            <div className="relative flex-1">
              {rowStarts.map((minutes) => (
                <div
                  key={minutes}
                  className="absolute inset-x-0 border-t border-gray-100"
                  style={{ top: `${toPercent(minutes)}%` }}
                />
              ))}
              {dayBlocks.map((cls) => {
                const block = cls.timeBlock!
                const topPercent = toPercent(timeToMinutes(block.start))
                const heightPercent =
                  ((timeToMinutes(block.end) - timeToMinutes(block.start)) / axisSpan) * 100
                const isConflicting = dayConflicts.has(cls.id)
                const layout = dayLayouts.get(cls.id) ?? { column: 0, columnCount: 1 }
                const widthPercent = 100 / layout.columnCount
                return (
                  <div
                    key={cls.id}
                    className={`group absolute overflow-hidden rounded border px-1.5 py-1 leading-tight ${
                      isConflicting ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'
                    }`}
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
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
                    <p
                      className="truncate font-medium text-gray-900"
                      style={{ fontSize: `${TEXT_SIZES.classBlockTitle}rem` }}
                    >
                      {cls.name}
                    </p>
                    <p
                      className="truncate text-gray-500"
                      style={{ fontSize: `${TEXT_SIZES.classBlockDetail}rem` }}
                    >
                      {formatTimeRange(block.start, block.end)}
                    </p>
                    {cls.location && (
                      <p
                        className="truncate text-gray-500"
                        style={{ fontSize: `${TEXT_SIZES.classBlockDetail}rem` }}
                      >
                        {cls.location}
                      </p>
                    )}
                    {isConflicting && (
                      <p
                        className="font-medium text-red-600"
                        style={{ fontSize: `${TEXT_SIZES.classBlockDetail}rem` }}
                      >
                        conflict
                      </p>
                    )}
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
