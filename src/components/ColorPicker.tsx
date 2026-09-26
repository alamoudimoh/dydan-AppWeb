import { COLORS, LABEL_COLORS } from '../utils/Colors'

/**
 * Swatch picker for a persisted entity color.
 *
 * Colors are constrained to LABEL_COLORS, the palette the clients and the
 * server already agree on for stored entity colors (labels, projects, saved
 * filters). That is deliberate: a free-form hex input would let a record
 * round-trip a value nothing else in the product can render, and these
 * values are DATA rather than theme tokens, so they must not be re-mapped
 * per brand or light/dark mode.
 */
export default function ColorPicker({
  label = 'Color',
  onChange,
  value,
}: {
  label?: string
  onChange: (value: string) => void
  value: string
}) {
  // A category with no color yet (an older row, or a default seeded before
  // colors existed) has nothing selected; fall back to the neutral swatch so
  // the control never renders empty.
  const selected = value || COLORS.ash

  return (
    <div
      className='flex flex-col gap-1.5'
      role='radiogroup'
      aria-label={label}
      data-testid='color-picker'
    >
      {LABEL_COLORS.filter(color => color.name !== 'Default').map(color => {
        const isSelected = color.value === selected
        return (
          <button
            key={color.value}
            type='button'
            role='radio'
            aria-checked={isSelected}
            aria-label={color.name}
            title={color.name}
            data-color={color.value}
            onClick={() => onChange(color.value)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              cursor: 'pointer',
              background: color.value,
              border: isSelected
                ? '2px solid var(--t-primary)'
                : '1px solid var(--line-strong)',
              outline: isSelected ? '2px solid var(--focus-outer)' : 'none',
              outlineOffset: 1,
            }}
          />
        )
      })}
    </div>
  )
}
