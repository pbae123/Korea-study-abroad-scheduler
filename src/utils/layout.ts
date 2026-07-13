import type { Class } from '../types'
import { timeToMinutes } from './time'

export interface BlockLayout {
  column: number
  columnCount: number
}

// Assigns side-by-side columns to time-overlapping blocks within one day,
// so conflicting classes render next to each other instead of stacking
export function layoutDayBlocks(blocks: Class[]): Map<string, BlockLayout> {
  const sorted = [...blocks]
    .filter((c) => c.timeBlock)
    .sort((a, b) => timeToMinutes(a.timeBlock!.start) - timeToMinutes(b.timeBlock!.start))

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

  for (const cls of sorted) {
    const start = timeToMinutes(cls.timeBlock!.start)
    const end = timeToMinutes(cls.timeBlock!.end)

    const active = cluster.filter((entry) => entry.end > start)
    if (active.length === 0 && cluster.length > 0) finalizeCluster()
    cluster = active

    const usedColumns = new Set(cluster.map((entry) => entry.column))
    let column = 0
    while (usedColumns.has(column)) column++

    cluster.push({ id: cls.id, end, column })
    clusterIds.push(cls.id)
    clusterColumns = Math.max(clusterColumns, column + 1)
    layouts.set(cls.id, { column, columnCount: clusterColumns })
  }
  finalizeCluster()

  return layouts
}
