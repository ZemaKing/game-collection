import { useMemo } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { visiblePlatformNavItems } from '@/lib/navigation'

/** Platform links for the sidebar / mobile nav sheet, narrowed by the Settings platform choice. */
export function usePlatformNavItems() {
  const { platformSlugs } = useSettings().settings
  return useMemo(() => visiblePlatformNavItems(platformSlugs), [platformSlugs])
}
