import { Icon } from '../../App'

export type PagePrimaryActionData = {
  label: string
  icon: string
  onClick: () => void
  testId?: string
  disabled?: boolean
}

/** Page create action: callers own identity and behavior, never geometry. */
export default function PagePrimaryAction({
  disabled,
  icon,
  label,
  onClick,
  testId,
}: PagePrimaryActionData) {
  return (
    <button
      type='button'
      className='btn btn-primary page-primary-action'
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  )
}
