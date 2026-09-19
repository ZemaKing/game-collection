import { CheckIcon, CloseIcon, TrashIcon } from '@/components/icons/ActionIcons'
import { Button } from '@/components/ui/Button'
import { Dialog,DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'

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
          <Button icon={CloseIcon} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            icon={isDestructive ? TrashIcon : CheckIcon}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
