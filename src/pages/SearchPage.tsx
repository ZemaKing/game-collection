import { SearchPanel } from '@/features/search/components/SearchPanel'
import { useLocale } from '@/hooks/useLocale'

function SearchPage() {
  const { t } = useLocale()
  return (
    <>
      <h1 className="sr-only">{t('search.dialogTitle')}</h1>
      <SearchPanel autoFocus />
    </>
  )
}

export default SearchPage
