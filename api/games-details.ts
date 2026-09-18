import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getRawgGameDetails, RawgApiError } from './_rawg.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) {
    console.error('RAWG_API_KEY is not configured.')
    res.status(500).json({ error: 'Autofill is not configured.' })
    return
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : ''
  if (!id) {
    res.status(400).json({ error: 'Missing game id.' })
    return
  }

  try {
    const detail = await getRawgGameDetails(id, apiKey)
    res.status(200).json(detail)
  } catch (err) {
    if (err instanceof RawgApiError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    res.status(500).json({ error: 'Unexpected error.' })
  }
}
