import {
  ArrowLeftRight,
  Archive,
  BookOpen,
  Boxes,
  Clock,
  Gamepad2,
  Heart,
  Joystick,
  LayoutDashboard,
  LayoutGrid,
  PersonStanding,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'

export interface NavItem {
  labelKey: TranslationKey
  to: string
  icon: LucideIcon
}

export const primaryNavItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { labelKey: 'nav.allItems', to: '/items', icon: LayoutGrid },
  { labelKey: 'nav.games', to: '/games', icon: Gamepad2 },
  { labelKey: 'nav.specialEditions', to: '/special-editions', icon: Star },
  { labelKey: 'nav.steelbooks', to: '/steelbooks', icon: Archive },
  { labelKey: 'nav.artbooks', to: '/artbooks', icon: BookOpen },
  { labelKey: 'nav.figures', to: '/figures', icon: PersonStanding },
  { labelKey: 'nav.stuff', to: '/stuff', icon: Boxes },
]

// Stub list for Phase 2; real platforms are fetched from Supabase from Phase 8 onward.
// Platform names are proper nouns and are not translated.
export const platformNavItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'PlayStation 5', to: '/platforms/playstation-5', icon: Joystick },
  { label: 'PlayStation 4', to: '/platforms/playstation-4', icon: Joystick },
  { label: 'Steam', to: '/platforms/steam', icon: Joystick },
  { label: 'Epic Games', to: '/platforms/epic-games', icon: Joystick },
]

export const collectionNavItems: NavItem[] = [
  { labelKey: 'nav.wishlist', to: '/wishlist', icon: Heart },
  { labelKey: 'nav.tradedSold', to: '/traded-sold', icon: ArrowLeftRight },
  { labelKey: 'nav.recentlyAdded', to: '/recently-added', icon: Clock },
]
