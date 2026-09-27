import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/**
 * Mobile and tablet layouts (below Tailwind's `lg`, 1024px) and touch-first
 * devices of any width (e.g. a landscape iPad) page lists in by scrolling;
 * desktop keeps the explicit "Load More" button.
 */
const SCROLL_LOADING_QUERY = '(max-width: 1023px), (pointer: coarse)'

/** Start fetching the next page this far before the end of the list comes into view. */
const PRELOAD_MARGIN = '600px'

/** Nearest ancestor that scrolls vertically, or `null` (the viewport). */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node
  }
  return null
}

/** Whether the current device loads more list items on scroll rather than via a button. */
export function useScrollLoading(): boolean {
  return useMediaQuery(SCROLL_LOADING_QUERY)
}

/**
 * Calls `onLoadMore` whenever the returned sentinel element nears the
 * viewport while `enabled`. Attach the ref to an element placed after the
 * list. The observer is recreated each time `enabled` flips back on (i.e.
 * after every page finishes loading), so a sentinel that is still visible —
 * a short page on a tall screen — triggers the next load too.
 */
export function useLoadMoreOnScroll(enabled: boolean, onLoadMore: () => void) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    if (!enabled || !sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          onLoadMoreRef.current()
        }
      },
      // rootMargin only grows the root's box; the list scrolls inside AppShell's <main>, so that must be the root.
      { root: scrollParent(sentinel), rootMargin: `0px 0px ${PRELOAD_MARGIN} 0px` },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, sentinel])

  return setSentinel
}
