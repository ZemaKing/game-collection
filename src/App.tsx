import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import AllItemsPage from '@/pages/AllItemsPage'
import ArtbooksPage from '@/pages/ArtbooksPage'
import ComingSoonPage from '@/pages/ComingSoonPage'
import DashboardPage from '@/pages/DashboardPage'
import FiguresPage from '@/pages/FiguresPage'
import GamesPage from '@/pages/GamesPage'
import SpecialEditionsPage from '@/pages/SpecialEditionsPage'
import SteelbooksPage from '@/pages/SteelbooksPage'
import StuffPage from '@/pages/StuffPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="items" element={<AllItemsPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="special-editions" element={<SpecialEditionsPage />} />
        <Route path="steelbooks" element={<SteelbooksPage />} />
        <Route path="artbooks" element={<ArtbooksPage />} />
        <Route path="figures" element={<FiguresPage />} />
        <Route path="stuff" element={<StuffPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App
