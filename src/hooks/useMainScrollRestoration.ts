import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** How long a Back/Forward restore keeps waiting for the page's data to grow tall enough. */
const RESTORE_TIMEOUT_MS = 3000

/** Scroll offsets by history entry (`location.key`), kept for the session's lifetime. */
const positions = new Map<string, number>()

/**
 * Scroll handling for the app's scroll container (`<main>`, not the window,
 * so the browser's own restoration never applies and the old offset would
 * otherwise carry over to the next page):
 * - a new page (link, card, search result) starts at the top;
 * - Back/Forward returns to where that history entry was left. Its data
 *   loads asynchronously, so the restore re-applies as the content grows,
 *   until it reaches the offset, the user scrolls, or a short timeout.
 * Query-only changes on the same page (filters, sort) keep the position.
 */
export function useMainScrollRestoration(mainRef: RefObject<HTMLElement | null>) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const keyRef = useRef(location.key)
  const pathnameRef = useRef(location.pathname)

  // Remember the current entry's offset as the user scrolls.
  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    const onScroll = () => positions.set(keyRef.current, main.scrollTop)
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [mainRef])

  useLayoutEffect(() => {
    const main = mainRef.current
    const samePage = pathnameRef.current === location.pathname
    keyRef.current = location.key
    pathnameRef.current = location.pathname
    if (!main) return

    const saved = navigationType === 'POP' ? positions.get(location.key) : undefined
    if (saved === undefined) {
      if (!samePage) main.scrollTop = 0
      return
    }

    main.scrollTop = saved
    if (main.scrollTop >= saved - 1) return

    // Not tall enough yet: re-apply each frame while the page's data renders
    // (a lazy route's Suspense fallback swaps elements, so observing one would miss it).
    const deadline = performance.now() + RESTORE_TIMEOUT_MS
    let frame = 0
    const stop = () => {
      cancelAnimationFrame(frame)
      main.removeEventListener('wheel', stop)
      main.removeEventListener('touchstart', stop)
      main.removeEventListener('keydown', stop)
    }
    const tick = () => {
      main.scrollTop = saved
      if (main.scrollTop >= saved - 1 || performance.now() > deadline) stop()
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    main.addEventListener('wheel', stop, { passive: true })
    main.addEventListener('touchstart', stop, { passive: true })
    main.addEventListener('keydown', stop)
    return stop
  }, [location.key, location.pathname, navigationType, mainRef])
}
