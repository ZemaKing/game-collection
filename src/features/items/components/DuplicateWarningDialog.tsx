import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'
import { ITEM_TYPE_ROUTES } from '@/features/items/constants'
import type { AllItemRow, ItemType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface DuplicateWarningDialogProps {
  open: boolean
  itemType: ItemType
  matches: AllItemRow[]
  onAddAnyway: () => void
  onDismiss: () => void
}

/**
 * Shown right before an Add-flow save when `findLikelyDuplicates` finds an
 * existing item with the same title. Offers `View Existing`/`Update
 * Existing` per match (both abandon the new, unsaved form on navigate —
 * there's no merge logic, so "update" just means "go edit the existing
 * row"), plus one `Add Anyway` to proceed with the original save.
 */
export function DuplicateWarningDialog({
  open,
  itemType,
  matches,
  onAddAnyway,
  onDismiss,
}: DuplicateWarningDialogProps) {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="text-lg font-semibold text-text">
          {t('duplicates.dialogTitle')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted">
          {t('duplicates.dialogBody', { count: String(matches.length) })}
        </DialogDescription>

        <ul className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {matches.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                {item.subtitle && <p className="truncate text-xs text-muted">{item.subtitle}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${item.id}`)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text hover:bg-card-hover"
                >
                  {t('duplicates.viewExisting')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${item.id}/edit`)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text hover:bg-card-hover"
                >
                  {t('duplicates.updateExisting')}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-card-hover"
          >
            {t('form.keepEditing')}
          </button>
          <button
            type="button"
            onClick={onAddAnyway}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
          >
            {t('duplicates.addAnyway')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
