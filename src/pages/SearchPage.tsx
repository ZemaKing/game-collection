import { useSearchParams } from 'react-router-dom'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { useLocale } from '@/hooks/useLocale'

function SearchPage() {
  const { t } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  // The query lives in the URL (replaced, not pushed, so typing adds no history entries),
  // so Back from a result returns to the same results instead of an empty search.
  function mirrorQuery(query: string) {
    setSearchParams(query ? { q: query } : {}, { replace: true })
  }

  return (
    <>
      <h1 className="sr-only">{t('search.dialogTitle')}</h1>
      <SearchPanel autoFocus={!initialQuery} initialQuery={initialQuery} onQueryChange={mirrorQuery} />
    </>
  )
}

export default SearchPage
