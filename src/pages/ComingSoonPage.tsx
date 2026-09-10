import { useLocation } from 'react-router-dom'

function ComingSoonPage() {
  const location = useLocation()

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center">
      <h1 className="text-lg font-semibold text-text">Coming soon</h1>
      <p className="text-sm text-muted">
        <code>{location.pathname}</code> isn't built yet.
      </p>
    </div>
  )
}

export default ComingSoonPage
