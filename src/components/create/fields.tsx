import type { ChangeEvent, ReactNode } from 'react'

/* ─────────────────────────────────────────────
   Unified create system (Fix 03) — shared field primitives.

   Every create configuration composes its body from these primitives so all
   create modals share ONE field styling: section-label + `.input`, stacked
   with the same gap. The canonical modal shell owns everything else.
   ───────────────────────────────────────────── */

/**
 * One labeled field row. Uses the Project editor pattern: section-label above
 * the control, stacked in a fixed gap.
 */
export function CreateField({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode
  htmlFor?: string
  label: ReactNode
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={htmlFor} className='section-label' style={{ padding: 0 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

/** Shared single-line text/number input styled with the canonical `.input`. */
export function CreateTextField({
  ariaLabel,
  autoFocus,
  disabled,
  id,
  label,
  min,
  onChange,
  onSubmit,
  placeholder,
  step,
  type = 'text',
  value,
}: {
  ariaLabel?: string
  autoFocus?: boolean
  disabled?: boolean
  id: string
  label: ReactNode
  min?: string
  onChange: (value: string) => void
  /** Enter key submits the form. */
  onSubmit?: () => void
  placeholder?: string
  step?: string
  type?: 'text' | 'number'
  value: string
}) {
  return (
    <CreateField htmlFor={id} label={label}>
      <input
        id={id}
        className='input w-full'
        aria-label={ariaLabel}
        type={type}
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        onKeyDown={
          onSubmit
            ? event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onSubmit()
                }
              }
            : undefined
        }
      />
    </CreateField>
  )
}

/** Shared select input styled with the canonical `.input`. */
export function CreateSelectField<T extends string>({
  ariaLabel,
  disabled,
  id,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel?: string
  disabled?: boolean
  id: string
  label: ReactNode
  onChange: (value: T) => void
  options: readonly T[] | readonly { value: T; label: string }[]
  value: T
}) {
  const normalized = options.map(option =>
    typeof option === 'string' ? { value: option, label: option } : option,
  )
  return (
    <CreateField htmlFor={id} label={label}>
      <select
        id={id}
        className='input w-full'
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value as T)}
      >
        {normalized.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </CreateField>
  )
}

/** Shared multi-line textarea styled with the canonical `.input`. */
export function CreateTextareaField({
  disabled,
  id,
  label,
  onChange,
  rows = 2,
  value,
}: {
  id: string
  disabled?: boolean
  label: ReactNode
  onChange: (value: string) => void
  rows?: number
  value: string
}) {
  return (
    <CreateField htmlFor={id} label={label}>
      <textarea
        id={id}
        className='input w-full'
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
      />
    </CreateField>
  )
}
