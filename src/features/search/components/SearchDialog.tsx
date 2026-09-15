import * as RadixDialog from '@radix-ui/react-dialog'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { useLocale } from '@/hooks/useLocale'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { t } = useLocale()

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <RadixDialog.Content className="fixed top-24 left-1/2 z-50 flex max-h-[70vh] w-full max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card text-text shadow-xl outline-none">
          <RadixDialog.Title className="sr-only">{t('search.dialogTitle')}</RadixDialog.Title>
          <SearchPanel onNavigate={() => onOpenChange(false)} autoFocus />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
