import { useMediaQuery } from '@/hooks/useMediaQuery'

/** Tracks Tailwind's `md` breakpoint (768px) for chrome that must genuinely change structure, not just reflow via CSS. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
