import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EditIcon, TrashIcon } from '@/components/icons/ActionIcons'
import { Button, ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { fetchPlatforms } from '@/features/items/api'
import { calculateCompleteness, completenessFactsFromDetail } from '@/features/items/completeness'
import {
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  FORMAT_TAG_META,
  GENRE_META,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
  PLATFORM_ICONS,
} from '@/features/items/constants'
import { CompletenessBadge } from '@/features/items/components/CompletenessBadge'
import { DETAIL_FIELDS } from '@/features/items/detailFields'
import { EditionBadge } from '@/features/items/components/EditionBadge'
import { ItemDetailSkeleton } from '@/features/items/components/ItemDetailSkeleton'
import { ItemImage } from '@/features/items/components/ItemImage'
import { ItemNotFound } from '@/features/items/components/ItemNotFound'
import { MediaViewer } from '@/features/items/components/MediaViewer'
import { RelatedItemsSection } from '@/features/items/components/RelatedItemsSection'
import { useDeleteItem } from '@/features/items/useDeleteItem'
import { useItemDetail } from '@/features/items/useItemDetail'
import { useItemRelationships } from '@/features/items/useItemRelationships'
import type { ItemType, Platform } from '@/features/items/types'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

interface ItemDetailPageProps {
  itemType: ItemType
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
          className="-my-2 py-2.5 text-sm font-semibold text-accent hover:text-accent-hover"
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = useItemDetail(itemType, id)
  const relationships = useItemRelationships(itemType, id)
  const { remove, isDeleting, error: deleteError } = useDeleteItem(itemType)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const coverUploadFailed = (location.state as { coverUploadFailed?: boolean } | null)?.coverUploadFailed ?? false
  const [showCoverWarning, setShowCoverWarning] = useState(coverUploadFailed)

  useEffect(() => {
    if (!coverUploadFailed) return
    // Clear the navigation state so refresh/back doesn't re-show the warning.
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p])), [platforms])

  if (state.status === 'loading') {
    return <ItemDetailSkeleton />
  }

  if (state.status === 'not-found') {
    return <ItemNotFound itemType={itemType} />
  }

  if (state.status === 'error') {
    return <ErrorState message={t('listing.error', { message: state.message })} onRetry={state.reload} />
  }

  const { detail, images, tags } = state
  const meta = ITEM_TYPE_META[itemType]
  const fields = DETAIL_FIELDS[itemType]
    .map((field) => ({ ...field, text: field.value(detail, t, locale) }))
    .filter((field) => field.text !== null)

  const coverIndex = Math.max(
    images.findIndex((image) => image.is_cover),
    0,
  )
  const coverImage = images[coverIndex] ?? null
  const relationshipCount = relationships.parents.length + relationships.children.length
  const completeness = calculateCompleteness(
    itemType,
    completenessFactsFromDetail(detail, coverImage !== null),
  )

  async function handleDelete() {
    if (!id) return
    const ok = await remove(id)
    if (ok) {
      navigate(`/${ITEM_TYPE_ROUTES[itemType]}`, { state: { deletedTitle: detail.title } })
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <div className="flex flex-col gap-3 md:w-64 md:shrink-0 lg:w-72 xl:w-80">
        {coverImage ? (
          <button
            type="button"
            onClick={() => {
              setViewerIndex(coverIndex)
              setViewerOpen(true)
            }}
            className="cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ItemImage
              storagePath={coverImage.storage_path}
              itemType={itemType}
              alt={coverImage.alt_text ?? detail.title}
              className="aspect-[4/5] w-full rounded-xl"
              iconSize={64}
            />
          </button>
        ) : (
          <ItemImage
            storagePath={null}
            itemType={itemType}
            alt={detail.title}
            className="aspect-[4/5] w-full rounded-xl"
            iconSize={64}
          />
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-text">{t('detail.gallery')}</h2>
          {images.length === 0 ? (
            <p className="text-sm text-muted">{t('detail.noImages')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 md:grid-cols-3">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    setViewerIndex(i)
                    setViewerOpen(true)
                  }}
                  className="overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ItemImage
                    storagePath={image.storage_path}
                    itemType={itemType}
                    alt={image.alt_text ?? detail.title}
                    className="aspect-[4/5] w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="flex min-w-0 items-start gap-2 text-2xl font-bold text-text">
            <meta.icon size={22} className="mt-1.5 shrink-0 text-muted" />
            <span className="min-w-0 break-words">{detail.title}</span>
          </h1>
          {user && (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center [&>*]:justify-center">
              <Link
                to={`/${ITEM_TYPE_ROUTES[itemType]}/${id}/edit`}
                className={buttonClasses({ variant: 'primary' })}
              >
                <ButtonIcon icon={EditIcon} variant="primary" />
                {t('form.edit')}
              </Link>
              <Button
                variant="danger"
                icon={TrashIcon}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {t('form.delete')}
              </Button>
            </div>
          )}
        </header>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">{t('completeness.heading')}</span>
          <CompletenessBadge percent={completeness.percent} />
        </div>

        {deleteError && (
          <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
            {t('detail.deleteError', { message: deleteError })}
          </p>
        )}

        {showCoverWarning && (
          <ErrorState
            message={t('images.coverUploadFailed')}
            secondaryAction={
              <button
                type="button"
                onClick={() => setShowCoverWarning(false)}
                className="font-semibold hover:underline"
              >
                {t('images.dismiss')}
              </button>
            }
          />
        )}

        {fields.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {fields.map((field) => {
              const PlatformIcon =
                field.labelKey === 'filters.platform' && detail.platform ? PLATFORM_ICONS[detail.platform.slug] : null
              if (field.labelKey === 'filters.condition' && detail.condition) {
                const ConditionIcon = CONDITION_ICONS[detail.condition]
                return (
                  <div key={field.labelKey}>
                    <dt className="text-xs font-medium text-muted">{t(field.labelKey)}</dt>
                    <dd className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_COLORS[detail.condition].badge}`}
                      >
                        <ConditionIcon size={12} />
                        {t(CONDITION_LABEL_KEYS[detail.condition])}
                      </span>
                    </dd>
                  </div>
                )
              }
              if (field.labelKey === 'detail.editionName' && field.text) {
                return (
                  <div key={field.labelKey} className="min-w-0">
                    <dt className="text-xs font-medium text-muted">{t(field.labelKey)}</dt>
                    <dd className="mt-1 flex">
                      <EditionBadge name={field.text} variant="stacked" />
                    </dd>
                  </div>
                )
              }
              return (
                <div key={field.labelKey}>
                  <dt className="text-xs font-medium text-muted">{t(field.labelKey)}</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-text">
                    {PlatformIcon && <PlatformIcon size={14} className="shrink-0" />}
                    {field.text}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}

        {detail.description && (
          <section>
            <h2 className="heading-section mb-2 text-text">{t('detail.about')}</h2>
            <ExpandableDescription text={detail.description} />
          </section>
        )}

        {detail.notes && (
          <section>
            <h2 className="heading-section mb-2 text-text">{t('detail.notes')}</h2>
            <p className="text-sm text-muted">{detail.notes}</p>
          </section>
        )}

        {detail.genres.length > 0 && (
          <section>
            <h2 className="heading-section mb-2 text-text">{t('dashboard.genres')}</h2>
            <div className="flex flex-wrap gap-2">
              {detail.genres.map((genre) => {
                const meta = GENRE_META[genre.slug] ?? DEFAULT_GENRE_META
                const Icon = meta.icon
                return (
                  <span
                    key={genre.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.color.badge}`}
                  >
                    <Icon size={13} />
                    {genre.name}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {tags.length > 0 && (
          <section>
            <h2 className="heading-section mb-2 text-text">{t('filters.tags')}</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const meta = FORMAT_TAG_META[tag.slug]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-hover px-2.5 py-1 text-xs font-medium text-text"
                  >
                    <Icon size={13} className={meta.color} />
                    {t(meta.labelKey)}
                  </span>
                )
              })}
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

      <MediaViewer
        images={images}
        itemType={itemType}
        itemTitle={detail.title}
        open={viewerOpen}
        initialIndex={viewerIndex}
        onOpenChange={setViewerOpen}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('detail.deleteConfirmTitle')}
        description={t('detail.deleteConfirmBody', {
          images: String(images.length),
          relationships: String(relationshipCount),
        })}
        confirmLabel={t('form.delete')}
        cancelLabel={t('filters.cancel')}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
