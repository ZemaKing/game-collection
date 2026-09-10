import * as RadixTabs from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

export const Tabs = RadixTabs.Root

export function TabsList({
  className = '',
  ...props
}: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={`inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 ${className}`}
      {...props}
    />
  )
}

export function TabsTrigger({
  className = '',
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={`rounded-md px-3 py-1.5 text-sm font-medium text-muted outline-none data-[state=active]:bg-accent data-[state=active]:text-accent-fg ${className}`}
      {...props}
    />
  )
}

export const TabsContent = RadixTabs.Content
