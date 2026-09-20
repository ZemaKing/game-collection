import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'

const AddItemPage = lazy(() => import('@/pages/AddItemPage'))
const AllItemsPage = lazy(() => import('@/pages/AllItemsPage'))
const ArtbookDetailPage = lazy(() => import('@/pages/ArtbookDetailPage'))
const ArtbookEditPage = lazy(() => import('@/pages/ArtbookEditPage'))
const ArtbooksPage = lazy(() => import('@/pages/ArtbooksPage'))
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const FigureDetailPage = lazy(() => import('@/pages/FigureDetailPage'))
const FigureEditPage = lazy(() => import('@/pages/FigureEditPage'))
const FiguresPage = lazy(() => import('@/pages/FiguresPage'))
const GameDetailPage = lazy(() => import('@/pages/GameDetailPage'))
const GameEditPage = lazy(() => import('@/pages/GameEditPage'))
const GamesPage = lazy(() => import('@/pages/GamesPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const PlatformPage = lazy(() => import('@/pages/PlatformPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const RecentlyAddedPage = lazy(() => import('@/pages/RecentlyAddedPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'))
const SpecialEditionDetailPage = lazy(() => import('@/pages/SpecialEditionDetailPage'))
const SpecialEditionEditPage = lazy(() => import('@/pages/SpecialEditionEditPage'))
const SpecialEditionsPage = lazy(() => import('@/pages/SpecialEditionsPage'))
const SteelbookDetailPage = lazy(() => import('@/pages/SteelbookDetailPage'))
const SteelbookEditPage = lazy(() => import('@/pages/SteelbookEditPage'))
const SteelbooksPage = lazy(() => import('@/pages/SteelbooksPage'))
const StuffDetailPage = lazy(() => import('@/pages/StuffDetailPage'))
const StuffEditPage = lazy(() => import('@/pages/StuffEditPage'))
const StuffPage = lazy(() => import('@/pages/StuffPage'))

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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App
