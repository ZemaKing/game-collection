import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogTitle = RadixDialog.Title
export const DialogDescription = RadixDialog.Description

export function DialogContent({
  className = '',
  children,
  ...props
}: ComponentProps<typeof RadixDialog.Content>) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={`fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 text-text shadow-xl outline-none ${className}`}
        {...props}
      >
        {children}
        <RadixDialog.Close
          aria-label="Close"
          className="absolute top-4 right-4 text-muted hover:text-text"
        >
          <X size={18} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}
