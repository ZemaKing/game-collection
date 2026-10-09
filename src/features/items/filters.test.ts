import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  hasActiveFacets,
  parseFilters,
  serializeFilters,
  type Filters,
} from '@/features/items/filters'

const params = (query: string) => new URLSearchParams(query)

describe('parseFilters', () => {
  it('returns the defaults (with the viewer default sort) for an empty query', () => {
    expect(parseFilters(params(''), 'recently_added')).toEqual({
      ...DEFAULT_FILTERS,
      sort: 'recently_added',
    })
  })

  it('reads every facet from its short parameter', () => {
    const filters = parseFilters(
      params(
        'q=zelda&type=game,dlc&platform=p1,p2&genre=g1&tag=t1&edition=Collector%27s&year=2017,2023' +
          '&condition=sealed&from=2024-01-01&to=2024-12-31&sort=release_date',
      ),
      'title',
    )
    expect(filters).toEqual<Filters>({
      search: 'zelda',
      itemTypes: ['game', 'dlc'],
      platformIds: ['p1', 'p2'],
      genreIds: ['g1'],
      tagIds: ['t1'],
      editions: ["Collector's"],
      years: [2017, 2023],
      conditions: ['sealed'],
      collectionDateFrom: '2024-01-01',
      collectionDateTo: '2024-12-31',
      sort: 'release_date',
    })
  })

  it('drops unknown item types, conditions, non-integer years and empty list entries', () => {
    const filters = parseFilters(
      params('type=game,,boat&condition=mint,shiny&year=2020,abc,20.5,'),
      'title',
    )
    expect(filters.itemTypes).toEqual(['game'])
    expect(filters.conditions).toEqual(['mint'])
    expect(filters.years).toEqual([2020])
  })

  it('falls back to the default sort for an unknown sort, and treats empty dates as unset', () => {
    const filters = parseFilters(params('sort=price&from=&to='), 'last_updated')
    expect(filters.sort).toBe('last_updated')
    expect(filters.collectionDateFrom).toBeNull()
    expect(filters.collectionDateTo).toBeNull()
  })
})

describe('serializeFilters', () => {
  it('writes only active facets and trims the search text', () => {
    const next = serializeFilters(
      {
        ...DEFAULT_FILTERS,
        search: '  halo ',
        platformIds: ['p1', 'p2'],
        years: [2001],
      },
      params(''),
      'title',
    )
    expect(next.toString()).toBe('q=halo&platform=p1%2Cp2&year=2001')
  })

  it('omits the sort when it equals the viewer default, so shared links use the recipient default', () => {
    expect(
      serializeFilters(
        { ...DEFAULT_FILTERS, sort: 'title' },
        params(''),
        'title',
      ).has('sort'),
    ).toBe(false)
    expect(
      serializeFilters(
        { ...DEFAULT_FILTERS, sort: 'title' },
        params(''),
        'recently_added',
      ).get('sort'),
    ).toBe('title')
  })

  it('keeps unrelated parameters and replaces stale filter ones', () => {
    const next = serializeFilters(
      { ...DEFAULT_FILTERS, itemTypes: ['figure'] },
      params('view=list&type=game&q=old'),
      'title',
    )
    expect(next.get('view')).toBe('list')
    expect(next.get('type')).toBe('figure')
    expect(next.has('q')).toBe(false)
  })

  it('round-trips through parseFilters', () => {
    const filters: Filters = {
      search: 'mass effect',
      itemTypes: ['steelbook'],
      platformIds: ['p9'],
      genreIds: ['g1', 'g2'],
      tagIds: ['t2'],
      editions: ['Limited, Signed'],
      years: [2007],
      conditions: ['fair'],
      collectionDateFrom: '2020-05-01',
      collectionDateTo: null,
      sort: 'recently_added',
    }
    expect(
      parseFilters(serializeFilters(filters, params(''), 'title'), 'title'),
    ).toEqual({
      ...filters,
      // Edition names are comma-joined in the URL, so a comma inside one splits it (known limit).
      editions: ['Limited', ' Signed'],
    })
  })
})

describe('hasActiveFacets', () => {
  it('is false for the defaults and ignores the search text and sort', () => {
    expect(hasActiveFacets(DEFAULT_FILTERS)).toBe(false)
    expect(
      hasActiveFacets({
        ...DEFAULT_FILTERS,
        search: 'x',
        sort: 'release_date',
      }),
    ).toBe(false)
  })

  it.each<[string, Partial<Filters>]>([
    ['item type', { itemTypes: ['game'] }],
    ['platform', { platformIds: ['p'] }],
    ['genre', { genreIds: ['g'] }],
    ['tag', { tagIds: ['t'] }],
    ['edition', { editions: ['e'] }],
    ['year', { years: [2000] }],
    ['condition', { conditions: ['good'] }],
    ['from date', { collectionDateFrom: '2020-01-01' }],
    ['to date', { collectionDateTo: '2020-01-01' }],
  ])('is true for an active %s', (_, partial) => {
    expect(hasActiveFacets({ ...DEFAULT_FILTERS, ...partial })).toBe(true)
  })
})
