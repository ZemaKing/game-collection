/*
 * Browser-side accessibility audit for the running dev app (Phase 28). Not bundled: it is loaded
 * into a page from the dev server, e.g. in the browser console:
 *
 *   (0, eval)(await (await fetch('/scripts/a11y-audit.js')).text())
 *   await __a11y.runRoutes(['/', '/items', '/games'])   // axe + contrast on each route
 *   await __a11y.scan()                                 // axe on the current view only
 *   __a11y.contrast()                                   // text-contrast check on the current view
 *
 * It needs `axe-core` (a devDependency), which is fetched from node_modules through the dev server.
 *
 * Why a second contrast check: axe reports "incomplete" for text over gradients, images and
 * overlapping elements (every card's stretched link counts as an overlap), so `contrast()` resolves
 * each text element's colour and its composited ancestor backgrounds itself, in either theme. It
 * skips elements whose background is an image or gradient — check those by eye.
 */
;(() => {
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

  async function loadAxe() {
    if (window.axe) return
    const script = document.createElement('script')
    script.textContent = await (await fetch('/node_modules/axe-core/axe.min.js')).text()
    document.head.appendChild(script)
  }

  const summarize = (v) => ({
    id: v.id,
    impact: v.impact,
    count: v.nodes.length,
    sample: v.nodes.slice(0, 3).map((n) => {
      const msg = n.any[0]?.message || n.all[0]?.message || n.none[0]?.message || ''
      return `${n.target.join(' ')} :: ${msg.slice(0, 150)}`
    }),
  })

  async function scan() {
    await loadAxe()
    const res = await window.axe.run(document, {
      runOnly: { type: 'tag', values: TAGS },
      resultTypes: ['violations', 'incomplete'],
    })
    return {
      path: location.pathname + location.search,
      title: document.title,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      width: innerWidth,
      violations: res.violations.map(summarize),
      // Contrast "incomplete" is expected (see header); anything else needs a manual look.
      needsReview: res.incomplete.filter((v) => v.id !== 'color-contrast').map(summarize),
    }
  }

  function contrast() {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    // Canvas normalises any CSS colour syntax (oklch, color-mix, ...) to sRGB.
    const rgba = (css) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const luminance = ([r, g, b]) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]))

    function backgroundOf(el) {
      const layers = []
      let hasImage = false
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (cs.backgroundImage !== 'none') hasImage = true
        const c = rgba(cs.backgroundColor)
        layers.push(c)
        if (c[3] >= 0.999) break
      }
      let acc = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3)
      for (let i = layers.length - 1; i >= 0; i--) {
        acc = layers[i][3] >= 0.999 ? layers[i].slice(0, 3) : over(layers[i], acc)
      }
      return { rgb: acc, hasImage }
    }

    const fails = []
    const seen = new Set()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const el = node.parentElement
      if (!node.textContent.trim() || !el || seen.has(el)) continue
      seen.add(el)
      const box = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (!box.width || !box.height || cs.visibility === 'hidden' || cs.display === 'none') continue
      if (el.closest('.sr-only, [aria-hidden="true"], [disabled], [aria-disabled="true"]')) continue
      let opacity = 1
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) opacity *= +getComputedStyle(e).opacity
      const { rgb: bg, hasImage } = backgroundOf(el)
      if (hasImage) continue
      const fgRaw = rgba(cs.color)
      const fg = over([fgRaw[0], fgRaw[1], fgRaw[2], fgRaw[3] * opacity], bg)
      const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
      const ratio = (hi + 0.05) / (lo + 0.05)
      const size = parseFloat(cs.fontSize)
      const large = size >= 24 || (+cs.fontWeight >= 700 && size >= 18.66)
      const required = large ? 3 : 4.5
      if (ratio < required) {
        fails.push({
          ratio: +ratio.toFixed(2),
          required,
          text: node.textContent.trim().slice(0, 30),
          className: String(el.className).slice(0, 70),
        })
      }
    }
    return {
      path: location.pathname,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      checked: seen.size,
      fails,
    }
  }

  /** Client-side navigation (no reload), so this object survives between routes. */
  async function go(path, settleMs = 1800) {
    history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await new Promise((resolve) => setTimeout(resolve, settleMs))
  }

  async function runRoutes(paths) {
    const report = []
    for (const path of paths) {
      await go(path)
      const s = await scan()
      const c = contrast()
      report.push({
        path,
        title: s.title,
        theme: s.theme,
        width: s.width,
        violations: s.violations.map((v) => `${v.id}(${v.count}) ${v.sample[0]}`),
        needsReview: s.needsReview.map((v) => `${v.id}(${v.count})`),
        contrastFails: c.fails.slice(0, 8).map((f) => `${f.text} ${f.ratio}<${f.required} ${f.className}`),
      })
    }
    return report
  }

  window.__a11y = { scan, contrast, go, runRoutes }
})()
