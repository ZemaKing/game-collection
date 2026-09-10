import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import ComingSoonPage from '@/pages/ComingSoonPage'
import HomePage from '@/pages/HomePage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App
