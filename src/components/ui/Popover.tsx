import * as RadixPopover from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'

export const Popover = RadixPopover.Root
export const PopoverTrigger = RadixPopover.Trigger

export function PopoverContent({ className = '', sideOffset = 8, ...props }: ComponentProps<typeof RadixPopover.Content>) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        className={`z-50 rounded-lg border border-border bg-card text-text shadow-lg outline-none ${className}`}
        {...props}
      />
    </RadixPopover.Portal>
  )
}
