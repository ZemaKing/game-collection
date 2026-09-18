export interface GameSearchResult {
  id: number
  title: string
  releaseYear: string | null
  coverUrl: string | null
  platforms: string[]
}

export interface GameAutofillDetail {
  title: string
  released: string | null
  descriptionRaw: string | null
  developers: string[]
  publishers: string[]
  genres: string[]
  platforms: string[]
  backgroundImage: string | null
}

export type AutofillErrorKind = 'rateLimited' | 'unavailable' | 'network'

export class AutofillError extends Error {
  kind: AutofillErrorKind

  constructor(kind: AutofillErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>
  if (response.status === 429) throw new AutofillError('rateLimited', 'RAWG rate limit exceeded.')
  throw new AutofillError('unavailable', 'Autofill is currently unavailable.')
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new AutofillError('network', 'Network error.')
  }
  return parseResponse<T>(response)
}

export async function searchGames(query: string): Promise<GameSearchResult[]> {
  const data = await fetchJson<{ results: GameSearchResult[] }>(
    `/api/games-search?q=${encodeURIComponent(query)}`,
  )
  return data.results
}

export async function fetchGameDetail(id: number): Promise<GameAutofillDetail> {
  return fetchJson<GameAutofillDetail>(`/api/games-details?id=${encodeURIComponent(String(id))}`)
}

export async function fetchGameCoverFile(url: string, fileName: string): Promise<File> {
  let response: Response
  try {
    response = await fetch(`/api/games-image-proxy?url=${encodeURIComponent(url)}`)
  } catch {
    throw new AutofillError('network', 'Network error.')
  }
  if (!response.ok) throw new AutofillError('unavailable', 'Artwork download failed.')
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}
