import { useState } from 'react'

import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'

function TextModal({
  cancelText,
  current,
  isOpen,
  okText,
  onClose,
  onSave,
  title,
}) {
  const { ResponsiveModal } = useResponsiveModal()
  const [text, setText] = useState(current)

  const handleSave = () => {
    onSave(text)
    onClose()
  }

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={onClose}
      size='md'
      title={title}
      footer={
        <ModalActions
          secondary={{ label: cancelText || 'Cancel', onClick: onClose }}
          primary={{ label: okText || 'Save', onClick: handleSave }}
        />
      }
    >
      <textarea
        autoFocus
        className='input'
        placeholder='Type in here…'
        value={text}
        onChange={event => setText(event.target.value)}
        rows={3}
        style={{ resize: 'vertical' }}
      />
    </ResponsiveModal>
  )
}

export default TextModal
