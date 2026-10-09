import { describe, expect, it } from 'vitest'

import { heroSrcSet, heroWidths, staticImageJobs } from './plan.ts'

describe('heroWidths', () => {
  it('keeps the targets that fit the source, in ascending order', () => {
    expect(heroWidths(4000, [2200, 1200])).toEqual([1200, 2200])
  })

  it('never enlarges: a target wider than the source becomes the source width', () => {
    expect(heroWidths(2172)).toEqual([800, 1200, 2172])
  })

  it('collapses duplicates when the source is narrower than every target', () => {
    expect(heroWidths(700)).toEqual([700])
  })
})

describe('heroSrcSet', () => {
  it('lists each file with its width descriptor', () => {
    expect(heroSrcSet([1200, 2172])).toBe(
      '/dashboard_cover-1200.webp 1200w, /dashboard_cover-2172.webp 2172w',
    )
  })
})

describe('staticImageJobs', () => {
  it('writes unique files, none of them over a source', () => {
    const jobs = staticImageJobs(2172)
    const files = jobs.flatMap((job) =>
      job.outputs.map((o) => `public/${o.file}`),
    )
    expect(new Set(files).size).toBe(files.length)
    for (const job of jobs) expect(files).not.toContain(job.source)
  })
})
