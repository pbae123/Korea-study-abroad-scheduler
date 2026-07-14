import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY_PREFIX = 'ksas:paneWidth:'

interface UseResizableWidthOptions {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
}

interface UseResizableWidthResult {
  width: number
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Drag state lives in a ref (not state) so pointermove doesn't re-run this hook's setup on every pixel
export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
}: UseResizableWidthOptions): UseResizableWidthResult {
  const fullKey = STORAGE_KEY_PREFIX + storageKey
  const [width, setWidth] = useState<number>(() => {
    const raw = localStorage.getItem(fullKey)
    const parsed = raw === null ? NaN : Number(raw)
    return Number.isFinite(parsed) ? clamp(parsed, minWidth, maxWidth) : defaultWidth
  })
  const dragStart = useRef<{ pointerX: number; startWidth: number } | null>(null)

  useEffect(() => {
    localStorage.setItem(fullKey, String(width))
  }, [fullKey, width])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragStart.current = { pointerX: event.clientX, startWidth: width }
    },
    [width],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current) return
      const delta = event.clientX - dragStart.current.pointerX
      setWidth(clamp(dragStart.current.startWidth + delta, minWidth, maxWidth))
    },
    [minWidth, maxWidth],
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  return { width, handlePointerDown, handlePointerMove, handlePointerUp }
}
