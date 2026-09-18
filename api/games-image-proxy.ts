import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_HOSTS = new Set(['media.rawg.io'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url : ''

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    res.status(400).json({ error: 'Invalid image URL.' })
    return
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    res.status(400).json({ error: 'Image host is not allowed.' })
    return
  }

  let upstream: Response
  try {
    upstream = await fetch(target.toString())
  } catch {
    res.status(502).json({ error: 'Unable to reach image host.' })
    return
  }

  if (!upstream.ok) {
    res.status(502).json({ error: 'Image fetch failed.' })
    return
  }

  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  const buffer = Buffer.from(await upstream.arrayBuffer())
  res.status(200).send(buffer)
}
