import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import AddItemPage from '@/pages/AddItemPage'
import AllItemsPage from '@/pages/AllItemsPage'
import ArtbookDetailPage from '@/pages/ArtbookDetailPage'
import ArtbookEditPage from '@/pages/ArtbookEditPage'
import ArtbooksPage from '@/pages/ArtbooksPage'
import ComingSoonPage from '@/pages/ComingSoonPage'
import DashboardPage from '@/pages/DashboardPage'
import FigureDetailPage from '@/pages/FigureDetailPage'
import FigureEditPage from '@/pages/FigureEditPage'
import FiguresPage from '@/pages/FiguresPage'
import GameDetailPage from '@/pages/GameDetailPage'
import GameEditPage from '@/pages/GameEditPage'
import GamesPage from '@/pages/GamesPage'
import LoginPage from '@/pages/LoginPage'
import PlatformPage from '@/pages/PlatformPage'
import RecentlyAddedPage from '@/pages/RecentlyAddedPage'
import SearchPage from '@/pages/SearchPage'
import StatisticsPage from '@/pages/StatisticsPage'
import SpecialEditionDetailPage from '@/pages/SpecialEditionDetailPage'
import SpecialEditionEditPage from '@/pages/SpecialEditionEditPage'
import SpecialEditionsPage from '@/pages/SpecialEditionsPage'
import SteelbookDetailPage from '@/pages/SteelbookDetailPage'
import SteelbookEditPage from '@/pages/SteelbookEditPage'
import SteelbooksPage from '@/pages/SteelbooksPage'
import StuffDetailPage from '@/pages/StuffDetailPage'
import StuffEditPage from '@/pages/StuffEditPage'
import StuffPage from '@/pages/StuffPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="items" element={<AllItemsPage />} />
        <Route
          path="items/new"
          element={
            <RequireAuth>
              <AddItemPage />
            </RequireAuth>
          }
        />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:id" element={<GameDetailPage />} />
        <Route
          path="games/:id/edit"
          element={
            <RequireAuth>
              <GameEditPage />
            </RequireAuth>
          }
        />
        <Route path="special-editions" element={<SpecialEditionsPage />} />
        <Route path="special-editions/:id" element={<SpecialEditionDetailPage />} />
        <Route
          path="special-editions/:id/edit"
          element={
            <RequireAuth>
              <SpecialEditionEditPage />
            </RequireAuth>
          }
        />
        <Route path="steelbooks" element={<SteelbooksPage />} />
        <Route path="steelbooks/:id" element={<SteelbookDetailPage />} />
        <Route
          path="steelbooks/:id/edit"
          element={
            <RequireAuth>
              <SteelbookEditPage />
            </RequireAuth>
          }
        />
        <Route path="artbooks" element={<ArtbooksPage />} />
        <Route path="artbooks/:id" element={<ArtbookDetailPage />} />
        <Route
          path="artbooks/:id/edit"
          element={
            <RequireAuth>
              <ArtbookEditPage />
            </RequireAuth>
          }
        />
        <Route path="figures" element={<FiguresPage />} />
        <Route path="figures/:id" element={<FigureDetailPage />} />
        <Route
          path="figures/:id/edit"
          element={
            <RequireAuth>
              <FigureEditPage />
            </RequireAuth>
          }
        />
        <Route path="stuff" element={<StuffPage />} />
        <Route path="stuff/:id" element={<StuffDetailPage />} />
        <Route
          path="stuff/:id/edit"
          element={
            <RequireAuth>
              <StuffEditPage />
            </RequireAuth>
          }
        />
        <Route path="platforms/:slug" element={<PlatformPage />} />
        <Route path="recently-added" element={<RecentlyAddedPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App
