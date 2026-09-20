/*
 * Focus return for dialogs and sheets. Radix hands focus back on close only to a `Trigger`
 * element, but every dialog in this app is opened from state (a button's onClick, Ctrl+K, ...),
 * so without help focus would fall to <body> and a keyboard user would have to Tab in from the
 * top of the page again (WCAG 2.4.3). This remembers the last element focused outside any
 * overlay; pass `restoreFocusOnClose` as the dialog content's `onCloseAutoFocus`.
 */

const OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'

let lastOutsideOverlay: HTMLElement | null = null

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target
      if (target instanceof HTMLElement && !target.closest(OVERLAY_SELECTOR)) {
        lastOutsideOverlay = target
      }
    },
    true,
  )
}

/** For `onCloseAutoFocus`: put focus back where it was before the dialog opened. */
export function restoreFocusOnClose(event: Event) {
  event.preventDefault()
  if (lastOutsideOverlay?.isConnected) lastOutsideOverlay.focus({ preventScroll: true })
}

/** For `onCloseAutoFocus` when the dialog closed by navigating: the opener is stale, start at the new page. */
export function focusMainOnClose(event: Event) {
  event.preventDefault()
  document.getElementById('main-content')?.focus({ preventScroll: true })
}
