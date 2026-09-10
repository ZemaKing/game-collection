export type Locale = 'sr' | 'en'

export const locales: { value: Locale; label: string }[] = [
  { value: 'sr', label: 'Srpski' },
  { value: 'en', label: 'English' },
]

const translations = {
  sr: {
    'sidebar.title': 'MOJA KOLEKCIJA',
    'sidebar.addNewItem': 'Dodaj novu stavku',
    'nav.dashboard': 'Kontrolna tabla',
    'nav.allItems': 'Sve stavke',
    'nav.games': 'Igre',
    'nav.specialEditions': 'Specijalna izdanja',
    'nav.steelbooks': 'Steelbook izdanja',
    'nav.artbooks': 'Artbook izdanja',
    'nav.figures': 'Figure',
    'nav.stuff': 'Ostalo',
    'nav.platformsSection': 'Platforme',
    'nav.collectionSection': 'Kolekcija',
    'nav.wishlist': 'Lista želja',
    'nav.tradedSold': 'Razmenjeno / Prodato',
    'nav.recentlyAdded': 'Nedavno dodato',
    'topbar.searchPlaceholder': 'Pretraži igre, izdanja, platforme...',
    'topbar.search': 'Pretraga',
    'topbar.collector': 'Kolekcionar',
    'bottomTab.home': 'Početna',
    'bottomTab.search': 'Pretraga',
    'bottomTab.wishlist': 'Želje',
    'bottomTab.profile': 'Profil',
    'bottomTab.addNewItem': 'Dodaj novu stavku',
    'home.welcome': 'Dobrodošli nazad, Kolekcionaru! 👋',
    'home.subtitle': 'Vaš svet igara, prelepo organizovan.',
    'comingSoon.title': 'Uskoro stiže',
    'comingSoon.subtitleSuffix': "još nije napravljeno.",
    'theme.change': 'Promeni temu',
    'theme.light': 'Svetla',
    'theme.dark': 'Tamna',
    'theme.system': 'Sistemska',
    'locale.change': 'Promeni jezik',
  },
  en: {
    'sidebar.title': 'MY COLLECTION',
    'sidebar.addNewItem': 'Add New Item',
    'nav.dashboard': 'Dashboard',
    'nav.allItems': 'All Items',
    'nav.games': 'Games',
    'nav.specialEditions': 'Special Editions',
    'nav.steelbooks': 'Steelbooks',
    'nav.artbooks': 'Artbooks',
    'nav.figures': 'Figures',
    'nav.stuff': 'Stuff',
    'nav.platformsSection': 'Platforms',
    'nav.collectionSection': 'Collection',
    'nav.wishlist': 'Wishlist',
    'nav.tradedSold': 'Traded / Sold',
    'nav.recentlyAdded': 'Recently Added',
    'topbar.searchPlaceholder': 'Search games, editions, platforms...',
    'topbar.search': 'Search',
    'topbar.collector': 'Collector',
    'bottomTab.home': 'Home',
    'bottomTab.search': 'Search',
    'bottomTab.wishlist': 'Wishlist',
    'bottomTab.profile': 'Profile',
    'bottomTab.addNewItem': 'Add New Item',
    'home.welcome': 'Welcome back, Collector! 👋',
    'home.subtitle': 'Your gaming universe, beautifully organized.',
    'comingSoon.title': 'Coming soon',
    'comingSoon.subtitleSuffix': "isn't built yet.",
    'theme.change': 'Change theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'locale.change': 'Change language',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type TranslationKey = keyof (typeof translations)['sr']

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string>,
): string {
  let text: string = translations[locale][key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, value)
    }
  }
  return text
}
