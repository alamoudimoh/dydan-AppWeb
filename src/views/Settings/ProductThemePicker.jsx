import { useProductTheme } from '../../contexts/ThemeContext'
import OptionButtonGroup from './OptionButtonGroup'

/**
 * Switches between the two built-in product themes (Dydan / Sovereign).
 * Persisted through ThemeContext under the dydan.theme storage key; the
 * choice is applied to the Joy theme, the CSS variable shell (data-theme)
 * and the logo mark.
 */
const ProductThemePicker = () => {
  const { brand, setBrand } = useProductTheme()

  return (
    <OptionButtonGroup
      onChange={setBrand}
      options={[
        { label: 'dydan', value: 'dydan' },
        { label: 'Sovereign', value: 'sovereign' },
      ]}
      value={brand}
    />
  )
}

export default ProductThemePicker
