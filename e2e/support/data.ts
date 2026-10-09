// The expected side of the E2E assertions: the collection read straight from PostgREST with the
// public anon key (GET only — exactly what a signed-out visitor can see). Deliberately does not
// reuse src/features: a bug in the app's queries or filters must not also move the oracle, and
// counts follow the live data, so adding an item never breaks the suite.
import { loadEnv } from './env.ts'

export type ItemType =
  | 'game'
  | 'special_edition'
  | 'steelbook'
  | 'artbook'
  | 'figure'
  | 'stuff'
  | 'dlc'

export type OracleItem = {
  id: string
  item_type: ItemType
  title: string
  platform_id: string | null
}

export type OraclePlatform = { id: string; name: string; slug: string }

export type Collection = {
  items: OracleItem[]
  byType: Map<ItemType, OracleItem[]>
  platforms: OraclePlatform[]
  /** platform id → number of items on it. */
  platformCounts: Map<string, number>
  /** item id → number of images. */
  imageCounts: Map<string, number>
}

/** The list route of each type (`ITEM_TYPE_ROUTES` in the app; repeated so the oracle stays independent). */
export const TYPE_ROUTES: Record<ItemType, string> = {
  game: 'games',
  special_edition: 'special-editions',
  steelbook: 'steelbooks',
  artbook: 'artbooks',
  figure: 'figures',
  stuff: 'stuff',
  dlc: 'dlcs',
}

const PAGE = 1000

/** Every row of a GET /rest/v1/<path>, paged with Range headers (Supabase caps a response at 1000). */
async function restGetAll<T>(path: string): Promise<T[]> {
  const { url, anonKey } = loadEnv()
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    })
    if (!response.ok)
      throw new Error(
        `E2E oracle: GET ${path} → HTTP ${response.status} ${await response.text()}`,
      )
    const page = (await response.json()) as T[]
    rows.push(...page)
    if (page.length < PAGE) return rows
  }
}

export async function fetchCollection(): Promise<Collection> {
  const [items, platforms, images] = await Promise.all([
    restGetAll<OracleItem>(
      'all_items?select=id,item_type,title,platform_id&order=id',
    ),
    restGetAll<OraclePlatform>('platforms?select=id,name,slug&order=name'),
    restGetAll<{ item_id: string }>('item_images?select=item_id&order=id'),
  ])
  if (items.length === 0)
    throw new Error('The collection is empty — the E2E journeys need items.')

  const byType = new Map<ItemType, OracleItem[]>()
  const platformCounts = new Map<string, number>()
  for (const item of items) {
    byType.set(item.item_type, [...(byType.get(item.item_type) ?? []), item])
    if (item.platform_id)
      platformCounts.set(
        item.platform_id,
        (platformCounts.get(item.platform_id) ?? 0) + 1,
      )
  }
  const imageCounts = new Map<string, number>()
  for (const { item_id } of images)
    imageCounts.set(item_id, (imageCounts.get(item_id) ?? 0) + 1)

  return { items, byType, platforms, platformCounts, imageCounts }
}

/** The platform with the most items — a stable, well-populated pick for filter journeys. */
export function largestPlatform(
  collection: Collection,
): OraclePlatform & { count: number } {
  const [best] = collection.platforms
    .map((p) => ({ ...p, count: collection.platformCounts.get(p.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
  return best
}

/** A game with at least `min` images (the most, ties by title), for gallery/viewer journeys. */
export function gameWithImages(
  collection: Collection,
  min = 2,
): OracleItem | undefined {
  return (collection.byType.get('game') ?? [])
    .filter((g) => (collection.imageCounts.get(g.id) ?? 0) >= min)
    .sort(
      (a, b) =>
        (collection.imageCounts.get(b.id) ?? 0) -
          (collection.imageCounts.get(a.id) ?? 0) ||
        a.title.localeCompare(b.title),
    )[0]
}

/** A title made only of plain words, so a search for it can't depend on punctuation folding. */
export function plainTitledItem(
  collection: Collection,
  type: ItemType = 'game',
): OracleItem {
  const pick = (collection.byType.get(type) ?? [])
    .filter((i) => /^[A-Za-z][A-Za-z ]{5,}[A-Za-z]$/.test(i.title))
    .sort((a, b) => a.title.localeCompare(b.title))[0]
  if (!pick) throw new Error(`No ${type} with a plain title to search for.`)
  return pick
}
