import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { VARIANT_CLASSES, buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonStyles'

const ICON_SIZES: Record<ButtonSize, number> = { md: 18, sm: 15, xs: 13 }

/** Renders a button icon tinted for its variant; pair with `buttonClasses` on non-`Button` elements. */
export function ButtonIcon({
  icon: Icon,
  variant = 'neutral',
  size = 'md',
}: {
  icon: (props: { size?: number; className?: string }) => ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return <Icon size={ICON_SIZES[size]} className={`shrink-0 ${VARIANT_CLASSES[variant].icon}`} />
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: (props: { size?: number; className?: string }) => ReactNode
}

export function Button({
  variant = 'neutral',
  size = 'md',
  icon,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {icon && <ButtonIcon icon={icon} variant={variant} size={size} />}
      {children}
    </button>
  )
}
