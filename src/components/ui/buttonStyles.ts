export type ButtonVariant = 'primary' | 'danger' | 'neutral'
export type ButtonSize = 'md' | 'sm' | 'xs'

/**
 * Outlined action buttons: a 1.5px coloured border on a transparent
 * background, tinted on hover and a little stronger while pressed.
 *  - primary: Edit / Save / Apply / confirm (accent blue)
 *  - danger:  Delete / destructive confirm (red)
 *  - neutral: Cancel / Back / secondary (grey)
 */
export const VARIANT_CLASSES: Record<ButtonVariant, { root: string; icon: string }> = {
  primary: {
    root: 'border-accent text-text hover:bg-accent/15 active:bg-accent/25',
    icon: 'text-accent',
  },
  danger: {
    root: 'border-danger text-danger hover:bg-danger/15 active:bg-danger/25',
    icon: 'text-danger',
  },
  neutral: {
    root: 'border-muted/60 text-text hover:bg-text/10 active:bg-text/5',
    icon: 'text-muted',
  },
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'gap-2 rounded-xl px-5 py-2 text-sm pointer-coarse:min-h-11',
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-xs pointer-coarse:min-h-10',
  xs: 'gap-1 rounded-lg px-2 py-1 text-tiny pointer-coarse:min-h-10 pointer-coarse:min-w-10',
}

interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Class string for anything that must look like a Button but isn't one (router `Link`, `RadixDialog.Close`). */
export function buttonClasses({ variant = 'neutral', size = 'md', className = '' }: ButtonClassOptions = {}): string {
  return [
    'inline-flex items-center justify-center border-[1.5px] bg-transparent font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50',
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant].root,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

