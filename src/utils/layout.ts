import type { MeetingBlock } from '../types'
import { timeToMinutes } from './time'

export interface BlockLayout {
  column: number
  columnCount: number
}

// Assigns side-by-side columns to time-overlapping blocks within one day,
// so conflicting classes render next to each other instead of stacking
export interface ScheduledBlock {
  id: string
  block: MeetingBlock
}

export function layoutDayBlocks(blocks: ScheduledBlock[]): Map<string, BlockLayout> {
  const sorted = [...blocks]
    .sort((a, b) => timeToMinutes(a.block.start) - timeToMinutes(b.block.start))

  const layouts = new Map<string, BlockLayout>()
  let cluster: { id: string; end: number; column: number }[] = []
  let clusterIds: string[] = []
  let clusterColumns = 0

  const finalizeCluster = () => {
    for (const id of clusterIds) {
      const layout = layouts.get(id)
      if (layout) layouts.set(id, { ...layout, columnCount: clusterColumns })
    }
    cluster = []
    clusterIds = []
    clusterColumns = 0
  }

  for (const scheduledBlock of sorted) {
    const start = timeToMinutes(scheduledBlock.block.start)
    const end = timeToMinutes(scheduledBlock.block.end)

    const active = cluster.filter((entry) => entry.end > start)
    if (active.length === 0 && cluster.length > 0) finalizeCluster()
    cluster = active

    const usedColumns = new Set(cluster.map((entry) => entry.column))
    let column = 0
    while (usedColumns.has(column)) column++

    cluster.push({ id: scheduledBlock.id, end, column })
    clusterIds.push(scheduledBlock.id)
    clusterColumns = Math.max(clusterColumns, column + 1)
    layouts.set(scheduledBlock.id, { column, columnCount: clusterColumns })
  }
  finalizeCluster()

  return layouts
}
