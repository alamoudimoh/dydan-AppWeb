import { useState } from 'react'

import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'

function SelectModal({
  displayKey,
  isOpen,
  onClose,
  onSave,
  options,
  placeholder,
  title,
}) {
  const { ResponsiveModal } = useResponsiveModal()
  const [selected, setSelected] = useState(null)

  const handleSave = () => {
    onSave(options.find(item => String(item.id) === selected))
    onClose()
  }

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={onClose}
      size='sm'
      title={title}
      footer={
        <ModalActions
          secondary={{ label: 'Cancel', onClick: onClose }}
          primary={{
            label: 'Save',
            onClick: handleSave,
            disabled: selected === null,
          }}
        />
      }
    >
      <select
        autoFocus
        className='input'
        value={selected ?? ''}
        onChange={event => setSelected(event.target.value)}
      >
        <option value='' disabled>
          {placeholder}
        </option>
        {options.map(item => (
          <option value={String(item.id)} key={item[displayKey]}>
            {item[displayKey]}
          </option>
        ))}
      </select>
    </ResponsiveModal>
  )
}

export default SelectModal
