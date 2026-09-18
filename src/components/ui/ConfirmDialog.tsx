import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  isDestructive?: boolean
}

/** Reusable Radix-Dialog-based confirmation prompt for destructive actions (image delete here, item delete in Phase 18). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isDestructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold text-text">{title}</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted">{description}</DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-card-hover"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isDestructive
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-accent text-accent-fg hover:bg-accent-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
