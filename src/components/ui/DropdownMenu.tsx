import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'

export const DropdownMenu = RadixDropdownMenu.Root
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger

export function DropdownMenuContent({
  className = '',
  sideOffset = 8,
  ...props
}: ComponentProps<typeof RadixDropdownMenu.Content>) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        sideOffset={sideOffset}
        className={`z-50 min-w-40 rounded-lg border border-border bg-card p-1 text-text shadow-lg outline-none ${className}`}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  )
}

export function DropdownMenuItem({
  className = '',
  ...props
}: ComponentProps<typeof RadixDropdownMenu.Item>) {
  return (
    <RadixDropdownMenu.Item
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-card-hover ${className}`}
      {...props}
    />
  )
}
