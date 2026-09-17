import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

/** Tracks Tailwind's `md` breakpoint (768px) for chrome that must genuinely change structure, not just reflow via CSS. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handleChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
