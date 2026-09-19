import type { SVGProps } from 'react'

/**
 * Stroke icons for action buttons (Edit / Delete / Cancel / Save …). Drawn on a
 * 24px grid with rounded 1.75px strokes, inheriting `currentColor` so the
 * `Button` variants can tint them independently of the label.
 */
export interface ActionIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

function Icon({ size = 18, children, ...props }: ActionIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function EditIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M16.9 3.6a2.1 2.1 0 0 1 3 3L7.6 18.9 3 20.4l1.5-4.6L16.9 3.6Z" />
      <path d="m14.6 6 3.4 3.4" />
    </Icon>
  )
}

export function TrashIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.8c0-.44.36-.8.8-.8h3.4c.44 0 .8.36.8.8V7" />
      <path d="M6 7l.8 12.2c.05.98.86 1.8 1.84 1.8h6.72c.98 0 1.79-.82 1.84-1.8L18 7" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  )
}

export function CloseIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5 5 19" />
    </Icon>
  )
}

export function CheckIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5L19.5 6.5" />
    </Icon>
  )
}

export function PlusIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

export function ArrowLeftIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Icon>
  )
}

export function ArrowRightIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  )
}

export function ArrowUpIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Icon>
  )
}

export function ArrowDownIcon(props: ActionIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </Icon>
  )
}
