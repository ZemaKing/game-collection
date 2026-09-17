import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import AllItemsPage from '@/pages/AllItemsPage'
import ArtbookDetailPage from '@/pages/ArtbookDetailPage'
import ArtbooksPage from '@/pages/ArtbooksPage'
import ComingSoonPage from '@/pages/ComingSoonPage'
import DashboardPage from '@/pages/DashboardPage'
import FigureDetailPage from '@/pages/FigureDetailPage'
import FiguresPage from '@/pages/FiguresPage'
import GameDetailPage from '@/pages/GameDetailPage'
import GamesPage from '@/pages/GamesPage'
import PlatformPage from '@/pages/PlatformPage'
import RecentlyAddedPage from '@/pages/RecentlyAddedPage'
import SearchPage from '@/pages/SearchPage'
import SpecialEditionDetailPage from '@/pages/SpecialEditionDetailPage'
import SpecialEditionsPage from '@/pages/SpecialEditionsPage'
import SteelbookDetailPage from '@/pages/SteelbookDetailPage'
import SteelbooksPage from '@/pages/SteelbooksPage'
import StuffDetailPage from '@/pages/StuffDetailPage'
import StuffPage from '@/pages/StuffPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="items" element={<AllItemsPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:id" element={<GameDetailPage />} />
        <Route path="special-editions" element={<SpecialEditionsPage />} />
        <Route path="special-editions/:id" element={<SpecialEditionDetailPage />} />
        <Route path="steelbooks" element={<SteelbooksPage />} />
        <Route path="steelbooks/:id" element={<SteelbookDetailPage />} />
        <Route path="artbooks" element={<ArtbooksPage />} />
        <Route path="artbooks/:id" element={<ArtbookDetailPage />} />
        <Route path="figures" element={<FiguresPage />} />
        <Route path="figures/:id" element={<FigureDetailPage />} />
        <Route path="stuff" element={<StuffPage />} />
        <Route path="stuff/:id" element={<StuffDetailPage />} />
        <Route path="platforms/:slug" element={<PlatformPage />} />
        <Route path="recently-added" element={<RecentlyAddedPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App
