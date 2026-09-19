import { useEffect, useMemo, useState } from 'react'
import { fetchStatisticsData, type StatisticsData } from '@/features/statistics/statisticsApi'
import { computeStatistics, type CollectionStatistics } from '@/features/statistics/statistics'

type FetchResult = { token: number; data: StatisticsData | null; error: string | null }

interface UseStatisticsResult {
  data: StatisticsData | null
  stats: CollectionStatistics | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useStatistics(): UseStatisticsResult {
  const [token, setToken] = useState(0)
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchStatisticsData()
      .then((data) => {
        if (!cancelled) setResult({ token, data, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ token, data: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // "Loading" is derived (a result for the current token hasn't landed yet)
  // rather than set inside the effect — same pattern as RecentlyAddedPage.
  const settled = result?.token === token ? result : null
  const data = settled?.data ?? null
  const stats = useMemo(() => (data ? computeStatistics(data.rows) : null), [data])

  return {
    data,
    stats,
    loading: settled === null,
    error: settled?.error ?? null,
    reload: () => setToken((n) => n + 1),
  }
}
