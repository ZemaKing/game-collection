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

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const primaryNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'All Items', to: '/items', icon: LayoutGrid },
  { label: 'Games', to: '/games', icon: Gamepad2 },
  { label: 'Special Editions', to: '/special-editions', icon: Star },
  { label: 'Steelbooks', to: '/steelbooks', icon: Archive },
  { label: 'Artbooks', to: '/artbooks', icon: BookOpen },
  { label: 'Figures', to: '/figures', icon: PersonStanding },
  { label: 'Stuff', to: '/stuff', icon: Boxes },
]

// Stub list for Phase 2; real platforms are fetched from Supabase from Phase 8 onward.
export const platformNavItems: NavItem[] = [
  { label: 'PlayStation 5', to: '/platforms/playstation-5', icon: Joystick },
  { label: 'PlayStation 4', to: '/platforms/playstation-4', icon: Joystick },
  { label: 'Steam', to: '/platforms/steam', icon: Joystick },
  { label: 'Epic Games', to: '/platforms/epic-games', icon: Joystick },
]

export const collectionNavItems: NavItem[] = [
  { label: 'Wishlist', to: '/wishlist', icon: Heart },
  { label: 'Traded / Sold', to: '/traded-sold', icon: ArrowLeftRight },
  { label: 'Recently Added', to: '/recently-added', icon: Clock },
]
