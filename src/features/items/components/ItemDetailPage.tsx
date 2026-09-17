import { Image as ImageIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPlatforms } from '@/features/items/api'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import { CoverPlaceholder } from '@/features/items/components/CoverPlaceholder'
import { DETAIL_FIELDS } from '@/features/items/detailFields'
import { RelatedItemsSection } from '@/features/items/components/RelatedItemsSection'
import { useItemDetail } from '@/features/items/useItemDetail'
import { useItemRelationships } from '@/features/items/useItemRelationships'
import type { ItemType, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface ItemDetailPageProps {
  itemType: ItemType
}

function NotFound({ itemType }: { itemType: ItemType }) {
  const { t } = useLocale()
  const meta = ITEM_TYPE_META[itemType]
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <meta.icon size={32} className="text-muted" />
      <h1 className="text-lg font-semibold text-text">{t('detail.notFound.title')}</h1>
      <p className="max-w-sm text-sm text-muted">{t('detail.notFound.body')}</p>
      <Link
        to={`/${ITEM_TYPE_ROUTES[itemType]}`}
        className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
      >
        {t('detail.backToListing', { label: t(meta.labelKey) })}
      </Link>
    </div>
  )
}

const DESCRIPTION_COLLAPSED_CLASS = 'line-clamp-3'

/** Only shows the Read More/Read Less toggle when the text actually overflows 3 lines. */
function ExpandableDescription({ text }: { text: string }) {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const checkOverflow = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <>
      <p
        ref={ref}
        className={`text-sm text-muted ${expanded ? '' : DESCRIPTION_COLLAPSED_CLASS}`}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t(expanded ? 'detail.readLess' : 'detail.readMore')}
        </button>
      )}
    </>
  )
}

export function ItemDetailPage({ itemType }: ItemDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, locale } = useLocale()
  const state = useItemDetail(itemType, id)
  const relationships = useItemRelationships(itemType, id)
  const [platforms, setPlatforms] = useState<Platform[]>([])

  useEffect(() => {
    let cancelled = false
    fetchPlatforms()
      .then((data) => {
        if (!cancelled) setPlatforms(data)
      })
      .catch(() => {
        // Only used to resolve related items' platform badges; non-critical.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])

  if (state.status === 'loading') {
    return <p className="text-center text-sm text-muted">{t('listing.loading')}</p>
  }

  if (state.status === 'not-found') {
    return <NotFound itemType={itemType} />
  }

  if (state.status === 'error') {
    return (
      <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
        {t('listing.error', { message: state.message })}
      </p>
    )
  }

  const { detail, images, tags } = state
  const meta = ITEM_TYPE_META[itemType]
  const fields = DETAIL_FIELDS[itemType]
    .map((field) => ({ ...field, text: field.value(detail, t, locale) }))
    .filter((field) => field.text !== null)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0 xl:w-80">
        <CoverPlaceholder
          itemType={itemType}
          className="aspect-[3/4] w-full rounded-xl"
          iconSize={64}
        />

        <section>
          <h2 className="mb-2 text-sm font-semibold text-text">{t('detail.gallery')}</h2>
          {images.length === 0 ? (
            <p className="text-sm text-muted">{t('detail.noImages')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="flex aspect-square items-center justify-center rounded-lg bg-card-hover text-muted"
                  title={image.alt_text ?? undefined}
                >
                  <ImageIcon size={18} strokeWidth={1.5} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
            <meta.icon size={22} className="shrink-0 text-muted" />
            {detail.title}
          </h1>
        </header>

        {fields.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.labelKey}>
                <dt className="text-xs font-medium text-muted">{t(field.labelKey)}</dt>
                <dd className="mt-0.5 text-sm text-text">{field.text}</dd>
              </div>
            ))}
          </dl>
        )}

        {detail.description && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text">{t('detail.about')}</h2>
            <ExpandableDescription text={detail.description} />
          </section>
        )}

        {detail.notes && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text">{t('detail.notes')}</h2>
            <p className="text-sm text-muted">{detail.notes}</p>
          </section>
        )}

        {detail.genres.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text">{t('dashboard.genres')}</h2>
            <div className="flex flex-wrap gap-2">
              {detail.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-medium text-text"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {tags.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text">{t('filters.tags')}</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-medium text-text"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {itemType === 'special_edition' ? (
          <>
            <RelatedItemsSection
              titleKey="detail.baseGame"
              items={relationships.parents}
              platformById={platformById}
            />
            <RelatedItemsSection
              titleKey="detail.contents"
              items={relationships.children}
              platformById={platformById}
            />
          </>
        ) : (
          <RelatedItemsSection
            titleKey="detail.relatedItems"
            items={[...relationships.parents, ...relationships.children]}
            platformById={platformById}
          />
        )}
      </div>
    </div>
  )
}
