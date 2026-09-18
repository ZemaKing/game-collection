import { ImageUp, Star, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { ITEM_TYPE_META } from '@/features/items/constants'
import { ItemImage } from '@/features/items/components/ItemImage'
import type { ItemImageRow } from '@/features/items/detailTypes'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGES_PER_ITEM } from '@/features/items/imageApi'
import type { ItemType } from '@/features/items/types'
import { useItemImages } from '@/features/items/useItemImages'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

interface ImageManagerProps {
  itemType: ItemType
  itemId: string
}

function errorMessage(t: (key: TranslationKey, vars?: Record<string, string>) => string, code: string, fileName: string) {
  if (code === 'invalidType') return t('images.errorInvalidType', { name: fileName })
  if (code === 'tooLarge') return t('images.errorTooLarge', { name: fileName })
  return t('images.errorMaxCount', { name: fileName, max: String(MAX_IMAGES_PER_ITEM) })
}

export function ImageManager({ itemType, itemId }: ImageManagerProps) {
  const { t } = useLocale()
  const meta = ITEM_TYPE_META[itemType]
  const {
    images,
    isLoading,
    error,
    validationErrors,
    uploadQueue,
    busyImageId,
    addFiles,
    dismissQueueItem,
    removeImage,
    replaceImage,
    moveImage,
    makeCover,
    saveAltText,
    reload,
  } = useItemImages(itemType, itemId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetRef = useRef<ItemImageRow | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ItemImageRow | null>(null)

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    void addFiles(Array.from(fileList))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    handleFilesSelected(event.dataTransfer.files)
  }

  function handleReplaceSelected(fileList: FileList | null) {
    const file = fileList?.[0]
    const target = replaceTargetRef.current
    if (!file || !target) return
    void replaceImage(target, file)
    replaceTargetRef.current = null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorState message={error} onRetry={reload} />}
      {validationErrors.map((issue, index) => (
        <p key={`${issue.code}-${issue.fileName}-${index}`} className="text-xs text-danger">
          {errorMessage(t, issue.code, issue.fileName)}
        </p>
      ))}

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDraggingOver ? 'border-accent bg-accent/5' : 'border-border hover:bg-card-hover'
        }`}
      >
        <ImageUp size={24} className="text-muted" />
        <p className="text-sm font-medium text-text">{t('images.uploadButton')}</p>
        <p className="text-xs text-muted">{t('images.dropHint')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(event) => {
            handleFilesSelected(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {uploadQueue.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {uploadQueue.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
            >
              <span className="truncate text-text">{item.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                {item.status === 'uploading' && <Spinner size={14} className="text-muted" />}
                <span
                  className={
                    item.status === 'error'
                      ? 'text-danger'
                      : item.status === 'done'
                        ? 'text-success'
                        : 'text-muted'
                  }
                >
                  {t(`images.${item.status}` as TranslationKey)}
                </span>
                {(item.status === 'done' || item.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => dismissQueueItem(item.id)}
                    className="text-muted hover:text-text"
                  >
                    {t('images.dismiss')}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <EmptyState body={t('images.empty')} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2">
              <div className="relative">
                <ItemImage
                  storagePath={image.storage_path}
                  itemType={itemType}
                  alt={image.alt_text ?? t(meta.labelKey)}
                  className="aspect-[4/5] w-full rounded-lg"
                />
                {image.is_cover && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-tiny font-medium text-accent-fg">
                    <Star size={10} fill="currentColor" />
                    {t('images.cover')}
                  </span>
                )}
                {busyImageId === image.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <Spinner size={20} className="text-white" />
                  </div>
                )}
              </div>

              <Input
                label={t('images.altTextLabel')}
                name={`alt-${image.id}`}
                defaultValue={image.alt_text ?? ''}
                placeholder={t('images.altTextPlaceholder')}
                onBlur={(event) => void saveAltText(image, event.target.value)}
              />

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={image.is_cover}
                  onClick={() => void makeCover(image)}
                  className="rounded-full border border-border px-2 py-1 text-tiny font-medium text-text hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('images.setCover')}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => void moveImage(image, -1)}
                  aria-label={t('images.moveUp')}
                  className="rounded-full border border-border px-2 py-1 text-tiny font-medium text-text hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => void moveImage(image, 1)}
                  aria-label={t('images.moveDown')}
                  className="rounded-full border border-border px-2 py-1 text-tiny font-medium text-text hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    replaceTargetRef.current = image
                    replaceInputRef.current?.click()
                  }}
                  className="rounded-full border border-border px-2 py-1 text-tiny font-medium text-text hover:bg-card-hover"
                >
                  {t('images.replace')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(image)}
                  className="ml-auto flex items-center gap-1 rounded-full border border-danger px-2 py-1 text-tiny font-medium text-danger hover:bg-danger-bg"
                >
                  <Trash2 size={12} />
                  {t('images.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          handleReplaceSelected(event.target.files)
          event.target.value = ''
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('images.deleteConfirmTitle')}
        description={t('images.deleteConfirmBody')}
        confirmLabel={t('images.delete')}
        cancelLabel={t('filters.cancel')}
        onConfirm={() => {
          if (deleteTarget) void removeImage(deleteTarget)
        }}
      />
    </div>
  )
}
