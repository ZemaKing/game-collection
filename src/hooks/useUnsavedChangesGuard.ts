import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type PendingLeave = { type: 'href'; href: string } | { type: 'action'; action: () => void }

/**
 * Lightweight unsaved-changes guard for a form that lives on its own route
 * (not a JS modal — see Phase 16's decision to use full-page routes for
 * Add/Edit). The app uses declarative `<BrowserRouter>`, not a data router,
 * so React Router's `useBlocker` (which needs a data router) isn't
 * available; this hand-rolls the same idea for the cases that matter most:
 *
 * - Same-origin `<a>` clicks (Sidebar/BottomTabBar/Cancel/etc. all render as
 *   real anchors via `Link`) are intercepted while dirty and redirected
 *   through a confirm step.
 * - `beforeunload` covers refresh, tab close, and navigating to an external
 *   URL.
 *
 * Deliberately out of scope (confirmed with the owner during planning): the
 * physical browser Back/Forward buttons, and programmatic `navigate()`
 * calls made by other components (e.g. selecting a Global Search result)
 * that don't go through a real anchor click. Covering those would require
 * migrating to a data router.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const navigate = useNavigate()
  const isDirtyRef = useRef(isDirty)
  const [pending, setPending] = useState<PendingLeave | null>(null)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return
      event.preventDefault()
    }

    function handleClick(event: MouseEvent) {
      if (!isDirtyRef.current) return
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin) return

      event.preventDefault()
      setPending({ type: 'href', href: url.pathname + url.search + url.hash })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  function guardAction(action: () => void) {
    if (isDirtyRef.current) {
      setPending({ type: 'action', action })
    } else {
      action()
    }
  }

  function confirmDiscard() {
    if (!pending) return
    isDirtyRef.current = false
    if (pending.type === 'href') navigate(pending.href)
    else pending.action()
    setPending(null)
  }

  function cancelDiscard() {
    setPending(null)
  }

  return { isBlocked: pending !== null, guardAction, confirmDiscard, cancelDiscard }
}
