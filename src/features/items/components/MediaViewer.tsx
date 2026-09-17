import * as RadixDialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { ItemImage } from '@/features/items/components/ItemImage'
import type { ItemImageRow } from '@/features/items/detailTypes'
import type { ItemType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface MediaViewerProps {
  images: ItemImageRow[]
  itemType: ItemType
  itemTitle: string
  open: boolean
  initialIndex: number
  onOpenChange: (open: boolean) => void
}

const SWIPE_THRESHOLD_PX = 50

export function MediaViewer({
  images,
  itemType,
  itemTitle,
  open,
  initialIndex,
  onOpenChange,
}: MediaViewerProps) {
  const { t } = useLocale()
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Reset to the requested image and un-zoom each time the viewer opens,
  // during render rather than in an effect (see
  // https://react.dev/learn/you-might-not-need-an-effect).
  const openKey = `${open}|${initialIndex}`
  const [lastOpenKey, setLastOpenKey] = useState(openKey)
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey)
    setIndex(initialIndex)
    setZoomed(false)
  }

  const hasMultiple = images.length > 1
  const current = images[index]

  function goPrev() {
    setZoomed(false)
    setIndex((i) => (i - 1 + images.length) % images.length)
  }
  function goNext() {
    setZoomed(false)
    setIndex((i) => (i + 1) % images.length)
  }

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // goPrev/goNext close over `images.length`, which is stable per open item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length])

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }
  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return
    if (deltaX > 0) goPrev()
    else goNext()
  }

  if (!current) return null

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black" />
        <RadixDialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-black outline-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <RadixDialog.Title className="sr-only">{itemTitle}</RadixDialog.Title>

          <div className="flex items-center justify-between gap-3 p-3 text-white sm:p-4">
            <span className="text-sm font-medium">
              {t('viewer.imageCount', { current: String(index + 1), total: String(images.length) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t(zoomed ? 'viewer.zoomOut' : 'viewer.zoomIn')}
                onClick={() => setZoomed((z) => !z)}
                className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"
              >
                {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </button>
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label={t('viewer.close')}
                  className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </RadixDialog.Close>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            {hasMultiple && (
              <button
                type="button"
                aria-label={t('viewer.previous')}
                onClick={goPrev}
                className="absolute left-2 z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:left-4"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <div
              className={`h-full w-full ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}
              onClick={() => setZoomed((z) => !z)}
            >
              <ItemImage
                key={current.id}
                storagePath={current.storage_path}
                itemType={itemType}
                alt={current.alt_text ?? itemTitle}
                iconSize={64}
                className={
                  zoomed
                    ? 'mx-auto h-[150%] w-[150%] max-w-none cursor-zoom-out'
                    : 'mx-auto h-full w-full cursor-zoom-in'
                }
              />
            </div>

            {hasMultiple && (
              <button
                type="button"
                aria-label={t('viewer.next')}
                onClick={goNext}
                className="absolute right-2 z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:right-4"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {hasMultiple && (
            <div className="flex shrink-0 gap-2 overflow-x-auto p-3 sm:p-4">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    setZoomed(false)
                    setIndex(i)
                  }}
                  className={`size-14 shrink-0 overflow-hidden rounded-lg ring-2 ${
                    i === index ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <ItemImage
                    storagePath={image.storage_path}
                    itemType={itemType}
                    alt={image.alt_text ?? itemTitle}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
