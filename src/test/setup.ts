import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Component tests opt in to jsdom with `// @vitest-environment jsdom`; pure-function tests stay on node.
if (typeof window !== 'undefined') {
  afterEach(() => cleanup())

  // jsdom gaps that Radix primitives rely on.
  window.HTMLElement.prototype.scrollIntoView ??= () => {}
  window.HTMLElement.prototype.hasPointerCapture ??= () => false
  window.HTMLElement.prototype.releasePointerCapture ??= () => {}
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof window !== 'undefined') {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList
}
