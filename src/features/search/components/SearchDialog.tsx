import * as RadixDialog from '@radix-ui/react-dialog'
import { useRef } from 'react'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { useLocale } from '@/hooks/useLocale'
import { focusMainOnClose, restoreFocusOnClose } from '@/lib/dialogFocus'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { t } = useLocale()
  // Picking a result navigates away; then focus belongs on the new page, not the old opener.
  const navigatedRef = useRef(false)

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            const navigated = navigatedRef.current
            navigatedRef.current = false
            if (navigated) focusMainOnClose(event)
            else restoreFocusOnClose(event)
          }}
          className="fixed top-24 left-1/2 z-50 flex max-h-[min(70vh,calc(100dvh-8rem))] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card text-text shadow-xl outline-none">
          <RadixDialog.Title className="sr-only">{t('search.dialogTitle')}</RadixDialog.Title>
          <SearchPanel
            onNavigate={() => {
              navigatedRef.current = true
              onOpenChange(false)
            }}
            autoFocus
          />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
