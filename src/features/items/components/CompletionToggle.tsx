import { Circle, CircleCheck } from 'lucide-react'
import { SegmentedToggle } from '@/features/items/components/SegmentedToggle'
import { useLocale } from '@/hooks/useLocale'

interface CompletionToggleProps {
  label: string
  name: string
  value: boolean
  onChange: (value: boolean) => void
}

/** Not Completed / Completed switch, styled like the Tags control. */
export function CompletionToggle({ label, name, value, onChange }: CompletionToggleProps) {
  const { t } = useLocale()
  return (
    <SegmentedToggle
      label={label}
      name={name}
      value={value ? 'yes' : 'no'}
      onChange={(next) => onChange(next === 'yes')}
      options={[
        { value: 'no', label: t('completed.no'), icon: Circle },
        { value: 'yes', label: t('completed.yes'), icon: CircleCheck, iconClass: 'text-success' },
      ]}
    />
  )
}
