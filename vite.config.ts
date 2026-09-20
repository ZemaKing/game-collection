import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { getRawgGameDetails, RawgApiError, searchRawgGames } from './api/_rawg.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * `npm run dev` runs plain `vite`, which doesn't serve the `/api` folder the
 * way Vercel does in production. This mounts the same three routes locally,
 * reusing the exact same RAWG helpers as the real serverless functions, so
 * autofill works under `npm run dev` without needing the `vercel dev` CLI.
 */
function rawgDevApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: 'rawg-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/games-search', (req, res) => {
        void (async () => {
          if (!apiKey) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Autofill is not configured.' }))
            return
          }
          const query = new URL(req.url ?? '', 'http://localhost').searchParams.get('q')?.trim() ?? ''
          if (!query) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing search query.' }))
            return
          }
          try {
            const results = await searchRawgGames(query, apiKey)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ results }))
          } catch (err) {
            res.statusCode = err instanceof RawgApiError ? err.status : 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }))
          }
        })()
      })

      server.middlewares.use('/api/games-details', (req, res) => {
        void (async () => {
          if (!apiKey) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Autofill is not configured.' }))
            return
          }
          const id = new URL(req.url ?? '', 'http://localhost').searchParams.get('id')?.trim() ?? ''
          if (!id) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing game id.' }))
            return
          }
          try {
            const detail = await getRawgGameDetails(id, apiKey)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(detail))
          } catch (err) {
            res.statusCode = err instanceof RawgApiError ? err.status : 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }))
          }
        })()
      })

      server.middlewares.use('/api/games-image-proxy', (req, res) => {
        void (async () => {
          const rawUrl = new URL(req.url ?? '', 'http://localhost').searchParams.get('url') ?? ''
          let target: URL
          try {
            target = new URL(rawUrl)
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid image URL.' }))
            return
          }
          if (target.protocol !== 'https:' || target.hostname !== 'media.rawg.io') {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Image host is not allowed.' }))
            return
          }
          try {
            const upstream = await fetch(target.toString())
            if (!upstream.ok) throw new Error('Image fetch failed.')
            res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream')
            res.end(Buffer.from(await upstream.arrayBuffer()))
          } catch {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Unable to reach image host.' }))
          }
        })()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), rawgDevApiPlugin(env.RAWG_API_KEY)],
    test: {
      setupFiles: ['./src/test/setup.ts'],
      env: { VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
    },
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
      },
    },
  }
})
