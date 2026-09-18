const RAWG_API_BASE = 'https://api.rawg.io/api'

export class RawgApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface RawgSearchResult {
  id: number
  title: string
  releaseYear: string | null
  coverUrl: string | null
  platforms: string[]
}

export interface RawgGameDetail {
  title: string
  released: string | null
  descriptionRaw: string | null
  developers: string[]
  publishers: string[]
  genres: string[]
  platforms: string[]
  backgroundImage: string | null
}

interface RawgPlatformEntry {
  platform?: { name?: string | null } | null
}

interface RawgNamedEntry {
  name?: string | null
}

interface RawgSearchResponse {
  results?: {
    id: number
    name?: string | null
    released?: string | null
    background_image?: string | null
    platforms?: RawgPlatformEntry[] | null
  }[]
}

interface RawgDetailResponse {
  name?: string | null
  released?: string | null
  description_raw?: string | null
  developers?: RawgNamedEntry[] | null
  publishers?: RawgNamedEntry[] | null
  genres?: RawgNamedEntry[] | null
  platforms?: RawgPlatformEntry[] | null
  background_image?: string | null
}

async function rawgFetch(path: string, apiKey: string): Promise<unknown> {
  const url = new URL(`${RAWG_API_BASE}${path}`)
  url.searchParams.set('key', apiKey)

  let response: Response
  try {
    response = await fetch(url.toString())
  } catch {
    throw new RawgApiError(502, 'Unable to reach RAWG.')
  }

  if (!response.ok) {
    if (response.status === 429) throw new RawgApiError(429, 'RAWG rate limit exceeded.')
    if (response.status === 404) throw new RawgApiError(404, 'Not found.')
    throw new RawgApiError(502, 'RAWG returned an error.')
  }

  return response.json()
}

export async function searchRawgGames(query: string, apiKey: string): Promise<RawgSearchResult[]> {
  const data = (await rawgFetch(
    `/games?search=${encodeURIComponent(query)}&page_size=10`,
    apiKey,
  )) as RawgSearchResponse

  return (data.results ?? []).map((result) => ({
    id: result.id,
    title: result.name ?? '',
    releaseYear: result.released ? result.released.slice(0, 4) : null,
    coverUrl: result.background_image ?? null,
    platforms: (result.platforms ?? [])
      .map((entry) => entry.platform?.name)
      .filter((name): name is string => Boolean(name)),
  }))
}

export async function getRawgGameDetails(id: string, apiKey: string): Promise<RawgGameDetail> {
  const data = (await rawgFetch(`/games/${encodeURIComponent(id)}`, apiKey)) as RawgDetailResponse

  return {
    title: data.name ?? '',
    released: data.released ?? null,
    descriptionRaw: data.description_raw ?? null,
    developers: (data.developers ?? []).map((entry) => entry.name).filter((name): name is string => Boolean(name)),
    publishers: (data.publishers ?? []).map((entry) => entry.name).filter((name): name is string => Boolean(name)),
    genres: (data.genres ?? []).map((entry) => entry.name).filter((name): name is string => Boolean(name)),
    platforms: (data.platforms ?? [])
      .map((entry) => entry.platform?.name)
      .filter((name): name is string => Boolean(name)),
    backgroundImage: data.background_image ?? null,
  }
}
