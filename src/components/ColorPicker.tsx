import { COLORS, LABEL_COLORS } from '../utils/Colors'
import ThemeSelect from './ThemeSelect'

/**
 * Dropdown picker for a persisted entity color.
 *
 * Colors are constrained to LABEL_COLORS, the palette the clients and the
 * server already agree on for stored entity colors (labels, projects, saved
 * filters). That is deliberate: a free-form hex input would let a record
 * round-trip a value nothing else in the product can render, and these values
 * are DATA rather than theme tokens, so they must not be re-mapped per brand
 * or light/dark mode.
 *
 * The control is the shared ThemeSelect dropdown rather than an inline swatch
 * grid. A 23-entry grid grew the edit form by several rows and pushed the
 * Save/Cancel actions out of view; as a dropdown the same palette costs one
 * row, and each option can carry its name beside the swatch, which is more
 * precise than picking a rectangle by eye.
 *
 * Geometry is opted into via `color-picker-field` rather than changed on the
 * shared component: a color has 23 possible values and does not need the full
 * form width, so the field is capped and the popover is matched to the trigger
 * instead of the shared fixed 228px. Projects and Routines keep theirs.
 */

/** The legacy no-color sentinel is not a color a user can pick, so it stays
 *  out; every other palette entry is offered by name, with its swatch. */
const PALETTE = LABEL_COLORS.filter(color => color.name !== 'Default').map(
  color => ({ value: color.value, label: color.name, swatch: color.value }),
)

/**
 * The palette, plus the record's own color when it is not in it.
 *
 * A row can hold a value the palette no longer offers: written before the
 * palette was constrained, or by a server that has since added a color.
 * Without this the trigger would show only its placeholder and the record
 * would look like it had no color at all, which reads as data loss. The stray
 * value stays visible and stays selected, so changing it is a deliberate act
 * rather than the only way to find out what was there.
 */
const optionsFor = (value: string) =>
  PALETTE.some(color => color.value === value)
    ? PALETTE
    : [{ value, label: value, swatch: value }, ...PALETTE]

export default function ColorPicker({
  label = 'Color',
  onChange,
  value,
}: {
  label?: string
  onChange: (value: string) => void
  value: string
}) {
  // A record with no color yet (an older row, or a default seeded before
  // colors existed) has nothing selected; fall back to the neutral swatch so
  // the control never renders empty. Display-only: the fallback is never
  // reported through onChange, so it cannot be written back by this control.
  const selected = value || COLORS.ash

  return (
    <ThemeSelect
      className='color-picker-field'
      label={label}
      value={selected}
      options={optionsFor(selected)}
      onChange={onChange}
    />
  )
}
