import type { VercelRequest, VercelResponse } from '@vercel/node'
import { RawgApiError, searchRawgGames } from './_rawg.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) {
    console.error('RAWG_API_KEY is not configured.')
    res.status(500).json({ error: 'Autofill is not configured.' })
    return
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    res.status(400).json({ error: 'Missing search query.' })
    return
  }

  try {
    const results = await searchRawgGames(query, apiKey)
    res.status(200).json({ results })
  } catch (err) {
    if (err instanceof RawgApiError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    res.status(500).json({ error: 'Unexpected error.' })
  }
}
