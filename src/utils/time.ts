import type { Class, Day, MeetingBlock } from '../types'

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`
}

function shareDay(daysA: Day[], daysB: Day[]): boolean {
  return daysA.some((day) => daysB.includes(day))
}

// True overlap only — back-to-back classes are not conflicts (CONTEXT.md "Conflict")
export function classesConflict(a: Class, b: Class): boolean {
  return a.meetingBlocks.some((blockA) =>
    b.meetingBlocks.some((blockB) => blocksConflict(blockA, blockB)),
  )
}

export function blocksConflict(a: MeetingBlock, b: MeetingBlock): boolean {
  if (!shareDay(a.days, b.days)) return false
  const startA = timeToMinutes(a.start)
  const endA = timeToMinutes(a.end)
  const startB = timeToMinutes(b.start)
  const endB = timeToMinutes(b.end)
  return startA < endB && startB < endA
}

// Ids of placed classes that conflict with at least one other placed class
export function findConflictingClassIds(placedClasses: Class[]): Set<string> {
  const conflicting = new Set<string>()
  for (let i = 0; i < placedClasses.length; i++) {
    for (let j = i + 1; j < placedClasses.length; j++) {
      if (classesConflict(placedClasses[i], placedClasses[j])) {
        conflicting.add(placedClasses[i].id)
        conflicting.add(placedClasses[j].id)
      }
    }
  }
  return conflicting
}
