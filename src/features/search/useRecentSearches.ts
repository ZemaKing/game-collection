import { useEffect, useState } from 'react'

const STORAGE_KEY = 'search.recent'
const MAX_RECENT = 8

function getStored(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(getStored)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
  }, [recent])

  function addRecent(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    setRecent((prev) =>
      [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT,
      ),
    )
  }

  function removeRecent(query: string) {
    setRecent((prev) => prev.filter((q) => q !== query))
  }

  function clearRecent() {
    setRecent([])
  }

  return { recent, addRecent, removeRecent, clearRecent }
}
