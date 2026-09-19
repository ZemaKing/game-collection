import {
  CUSTOM_EDITION_ICON,
  resolveEdition,
  type EditionDef,
} from '@/features/items/editions'
import { useLocale } from '@/hooks/useLocale'

interface EditionBadgeProps {
  /** The stored `edition_name`. Known editions get their own icon/color; anything else gets a neutral label. */
  name: string
  /** `inline` is the compact one-line label; `stacked` is the two-line "SPECIAL / EDITION" plate for roomy spots. */
  variant?: 'inline' | 'stacked'
  size?: 'sm' | 'md'
  className?: string
}

/** Localized display text for an edition name: `[short, suffix]`, or `[raw]` for free-text names. */
function useEditionLabel(name: string): {
  edition: EditionDef | null
  parts: string[]
  full: string
} {
  const { t } = useLocale()
  const edition = resolveEdition(name)
  const parts = edition ? [t(edition.nameKey), t('edition.suffix')] : [name]
  return { edition, parts, full: parts.join(' ') }
}

/** Icon chip in the edition's accent color; also used by the selector rows. */
export function EditionGlyph({
  edition,
  size = 14,
  className = '',
}: {
  edition: EditionDef | null
  size?: number
  className?: string
}) {
  const Icon = edition?.icon ?? CUSTOM_EDITION_ICON
  return (
    <span
      data-edition={edition?.key ?? 'custom'}
      className={`edition-scope edition-glyph inline-flex shrink-0 items-center justify-center rounded ${className}`}
      style={{ width: size + 8, height: size + 8 }}
    >
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

/**
 * Collectible-style label for a game edition — the one place edition identity
 * (icon + color + label) is rendered, so cards, rows, detail and the selector
 * all match. Shrinks with `min-w-0` + truncation instead of growing its parent.
 */
export function EditionBadge({
  name,
  variant = 'inline',
  size = 'md',
  className = '',
}: EditionBadgeProps) {
  const { edition, parts, full } = useEditionLabel(name)
  const key = edition?.key ?? 'custom'

  if (variant === 'stacked') {
    return (
      <span
        data-edition={key}
        title={full}
        className={`edition-scope edition-badge inline-flex max-w-full min-w-0 items-center gap-2.5 rounded-lg py-1.5 pr-3.5 pl-2 ${className}`}
      >
        <EditionGlyph edition={edition} size={18} className="rounded-md" />
        <span className="flex min-w-0 flex-col text-[0.6875rem] leading-[0.875rem] font-bold tracking-[0.08em] uppercase">
          <span className="truncate">{parts[0]}</span>
          {parts[1] && (
            <span className="truncate text-[0.625rem] leading-[0.75rem] font-semibold opacity-80">
              {parts[1]}
            </span>
          )}
        </span>
      </span>
    )
  }

  const box =
    size === 'sm' ? 'min-h-5 gap-1 pr-2 text-[0.6875rem]' : 'min-h-6 gap-1.5 pr-2.5 text-xs'
  return (
    <span
      data-edition={key}
      title={full}
      className={`edition-scope edition-badge inline-flex max-w-full min-w-0 shrink items-center rounded-md pl-0.5 font-semibold tracking-wide ${box} ${className}`}
    >
      <EditionGlyph
        edition={edition}
        size={size === 'sm' ? 11 : 13}
        className="rounded-[5px]"
      />
      <span className="truncate">{full}</span>
    </span>
  )
}
