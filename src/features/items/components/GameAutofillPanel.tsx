import { useMemo, useState } from 'react'
import { CheckIcon, CloseIcon } from '@/components/icons/ActionIcons'
import { Button } from '@/components/ui/Button'
import type { ItemFormState } from '@/features/items/forms/formState'
import { useGameAutofillSearch } from '@/features/items/forms/useGameAutofillSearch'
import {
  AutofillError,
  fetchGameCoverFile,
  fetchGameDetail,
  type GameAutofillDetail,
  type GameSearchResult,
} from '@/features/items/gameAutofillApi'
import type { Genre, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

interface GameAutofillPanelProps {
  form: ItemFormState
  genres: Genre[]
  platforms: Platform[]
  onApply: (values: Partial<ItemFormState>, coverImageFile?: File) => void
}

type RowKey = 'title' | 'release_date' | 'description' | 'developer' | 'publisher' | 'genres' | 'platform' | 'artwork'

function matchIdsByName(names: string[], options: { id: string; name: string }[]): string[] {
  const lower = new Map(options.map((option) => [option.name.toLowerCase(), option.id]))
  const matched = names.map((name) => lower.get(name.toLowerCase())).filter((id): id is string => Boolean(id))
  return Array.from(new Set(matched))
}

function matchSinglePlatformId(names: string[], platforms: Platform[]): string | null {
  const matched = matchIdsByName(names, platforms)
  return matched.length === 1 ? matched[0] : null
}

function errorMessageKey(kind: AutofillError['kind']): TranslationKey {
  if (kind === 'rateLimited') return 'autofill.errorRateLimited'
  if (kind === 'network') return 'autofill.errorNetwork'
  return 'autofill.errorUnavailable'
}

/**
 * RAWG search + selective-apply preview for the Game form (Phase 21). Only
 * ever merges checked rows into the caller's form state — never overwrites a
 * field the owner already typed unless they explicitly opt in by checking it.
 */
export function GameAutofillPanel({ form, genres, platforms, onApply }: GameAutofillPanelProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const { results, loading: searching, error: searchError } = useGameAutofillSearch(query)

  const [selected, setSelected] = useState<GameAutofillDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<AutofillError | null>(null)
  const [checks, setChecks] = useState<Record<RowKey, boolean>>({} as Record<RowKey, boolean>)
  const [artworkError, setArtworkError] = useState<AutofillError | null>(null)
  const [applying, setApplying] = useState(false)

  const matchedGenreIds = useMemo(
    () => (selected ? matchIdsByName(selected.genres, genres) : []),
    [selected, genres],
  )
  const matchedPlatformId = useMemo(
    () => (selected ? matchSinglePlatformId(selected.platforms, platforms) : null),
    [selected, platforms],
  )

  function reset() {
    setSelected(null)
    setChecks({} as Record<RowKey, boolean>)
    setDetailError(null)
    setArtworkError(null)
    setQuery('')
  }

  async function handleSelect(result: GameSearchResult) {
    setLoadingDetail(true)
    setDetailError(null)
    try {
      const detail = await fetchGameDetail(result.id)
      setSelected(detail)
      setChecks({
        title: form.title.trim() === '',
        release_date: form.release_date.trim() === '' && Boolean(detail.released),
        description: form.description.trim() === '' && Boolean(detail.descriptionRaw),
        developer: form.developer.trim() === '' && detail.developers.length > 0,
        publisher: form.publisher.trim() === '' && detail.publishers.length > 0,
        genres: form.genreIds.length === 0 && matchIdsByName(detail.genres, genres).length > 0,
        platform: form.platform_id.trim() === '' && matchSinglePlatformId(detail.platforms, platforms) !== null,
        artwork: Boolean(detail.backgroundImage),
      })
    } catch (err) {
      setDetailError(err instanceof AutofillError ? err : new AutofillError('network', 'Unexpected error.'))
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleApply() {
    if (!selected) return
    setApplying(true)
    setArtworkError(null)

    const values: Partial<ItemFormState> = {}
    if (checks.title) values.title = selected.title
    if (checks.release_date && selected.released) values.release_date = selected.released
    if (checks.description && selected.descriptionRaw) values.description = selected.descriptionRaw
    if (checks.developer && selected.developers[0]) values.developer = selected.developers[0]
    if (checks.publisher && selected.publishers[0]) values.publisher = selected.publishers[0]
    if (checks.genres && matchedGenreIds.length > 0) {
      values.genreIds = Array.from(new Set([...form.genreIds, ...matchedGenreIds]))
    }
    if (checks.platform && matchedPlatformId) values.platform_id = matchedPlatformId

    let coverImageFile: File | undefined
    if (checks.artwork && selected.backgroundImage) {
      try {
        coverImageFile = await fetchGameCoverFile(selected.backgroundImage, `${selected.title || 'cover'}.jpg`)
      } catch (err) {
        setArtworkError(err instanceof AutofillError ? err : new AutofillError('network', 'Unexpected error.'))
        setApplying(false)
        return
      }
    }

    onApply(values, coverImageFile)
    setApplying(false)
    reset()
  }

  function toggle(key: RowKey) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function renderRow(key: RowKey, labelKey: TranslationKey, incoming: string | null, disabled = false) {
    if (!incoming) return null
    return (
      <label
        key={key}
        className={`flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm ${disabled ? 'opacity-50' : ''}`}
      >
        <input
          type="checkbox"
          checked={Boolean(checks[key])}
          disabled={disabled}
          onChange={() => toggle(key)}
          className="mt-0.5"
        />
        <span className="flex flex-col">
          <span className="font-semibold text-text">{t(labelKey)}</span>
          <span className="text-muted">{incoming}</span>
        </span>
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <span className="text-label font-semibold text-text">{t('autofill.searchLabel')}</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('autofill.searchPlaceholder')}
        className="rounded-md border border-input bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {query.trim() !== '' && !selected && (
        <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
          {searching ? (
            <p className="px-3 py-2 text-xs text-muted">{t('autofill.searching')}</p>
          ) : searchError ? (
            <p className="px-3 py-2 text-xs text-danger">{t(errorMessageKey(searchError.kind))}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">{t('autofill.noResults')}</p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => void handleSelect(result)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text hover:bg-card-hover"
              >
                {result.coverUrl && (
                  <img src={result.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <span className="flex flex-col truncate">
                  <span className="truncate font-medium">{result.title}</span>
                  <span className="truncate text-xs text-muted">
                    {[result.releaseYear, result.platforms.slice(0, 3).join(', ')].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {loadingDetail && <p className="text-xs text-muted">{t('autofill.loadingDetail')}</p>}

      {detailError && <p className="text-xs text-danger">{t(errorMessageKey(detailError.kind))}</p>}

      {selected && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3">
          <h3 className="text-sm font-semibold text-text">{t('autofill.previewTitle')}</h3>
          <div className="flex flex-col gap-2">
            {renderRow('title', 'form.title', selected.title)}
            {renderRow('release_date', 'sort.release_date', selected.released)}
            {renderRow('developer', 'detail.developer', selected.developers[0] ?? null)}
            {renderRow('publisher', 'detail.publisher', selected.publishers[0] ?? null)}
            {renderRow(
              'genres',
              'filters.genre',
              selected.genres.length > 0 ? selected.genres.join(', ') : null,
              matchedGenreIds.length === 0,
            )}
            {renderRow(
              'platform',
              'filters.platform',
              selected.platforms.length > 0 ? selected.platforms.join(', ') : null,
              matchedPlatformId === null,
            )}
            {renderRow(
              'description',
              'detail.about',
              selected.descriptionRaw ? `${selected.descriptionRaw.slice(0, 160)}...` : null,
            )}
            {selected.backgroundImage &&
              renderRow('artwork', 'autofill.artwork', t('autofill.artworkAvailable'))}
          </div>

          {artworkError && <p className="text-xs text-danger">{t(errorMessageKey(artworkError.kind))}</p>}

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" icon={CloseIcon} onClick={reset}>
              {t('autofill.discardPreview')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={CheckIcon}
              disabled={applying}
              onClick={() => void handleApply()}
            >
              {t('autofill.applySelected')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
