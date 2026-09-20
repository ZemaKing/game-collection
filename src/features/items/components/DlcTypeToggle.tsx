import { Layers, PackagePlus } from 'lucide-react'
import { SegmentedToggle } from '@/features/items/components/SegmentedToggle'
import { ITEM_TYPE_COLORS } from '@/features/items/constants'
import type { DlcType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface DlcTypeToggleProps {
  label: string
  name: string
  value: DlcType
  onChange: (value: DlcType) => void
}

/** DLC / Expansion switch, styled like the Tags control. */
export function DlcTypeToggle({ label, name, value, onChange }: DlcTypeToggleProps) {
  const { t } = useLocale()
  const iconClass = ITEM_TYPE_COLORS.dlc.icon
  return (
    <SegmentedToggle
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      options={[
        { value: 'dlc', label: t('dlc.typeDlc'), icon: PackagePlus, iconClass },
        { value: 'expansion', label: t('dlc.typeExpansion'), icon: Layers, iconClass },
      ]}
    />
  )
}
