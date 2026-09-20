import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

/** Give up waiting for a page heading after this long (a route whose data never loads). */
const HEADING_WAIT_MS = 5000

/**
 * What a full page load gives for free, restored for client-side navigation:
 *  - `document.title` follows the page's `<h1>` (which may only appear once its data loads);
 *  - after each navigation the new page's title is returned as text for a live region, so
 *    screen-reader users learn the route changed;
 *  - if the navigation left keyboard focus nowhere (the focused link unmounted), focus moves
 *    to `main` so the next Tab continues in the new page rather than from the top of the document.
 * Only the pathname counts as navigation: filter and sort changes rewrite the query string.
 */
export function usePageA11y(mainRef: RefObject<HTMLElement | null>): string {
  const { pathname } = useLocation()
  const { t } = useLocale()
  const siteTitle = t('sidebar.title')
  const [announcement, setAnnouncement] = useState('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    let awaitingHeading = !isFirstRender.current
    isFirstRender.current = false

    function sync() {
      const heading = main?.querySelector('h1')?.textContent?.trim()
      document.title = heading && heading !== siteTitle ? `${heading} — ${siteTitle}` : siteTitle
      if (awaitingHeading && heading) {
        awaitingHeading = false
        setAnnouncement(heading)
        const active = document.activeElement
        if (!active || active === document.body) main?.focus({ preventScroll: true })
      }
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(main, { childList: true, subtree: true, characterData: true })
    const giveUp = window.setTimeout(() => {
      awaitingHeading = false
    }, HEADING_WAIT_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(giveUp)
    }
  }, [pathname, siteTitle, mainRef])

  return announcement
}
