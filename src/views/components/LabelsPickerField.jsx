import { useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import LabelModal from '../Modals/Inputs/LabelModal'
import BaseOptionPicker from './BaseOptionPicker'

const LabelsPickerField = ({
  emptyDisplay = 'icon-text',
  labels = [],
  onChange,
  onClear,
  values = [],
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const options = labels.map(label => ({
    id: label.id,
    name: label.name,
    color: label.color,
  }))

  return (
    <>
      <BaseOptionPicker
        items={options}
        multiple
        values={values}
        onValuesChange={onChange}
        onClear={onClear}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        emptyDisplay={emptyDisplay}
        emptyLabel='Labels'
        getItemValue={item => item.id}
        getItemLabel={item => item.name}
        getItemColor={item => item.color}
        renderTriggerIcon={() => <FigmaIcon name='tag' size={20} />}
        renderItemStart={({ item }) => (
          <span
            aria-hidden='true'
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: item.color || 'var(--t-muted)',
              flexShrink: 0,
            }}
          />
        )}
        getTriggerText={({ isEmpty, selectedItems }) => {
          if (isEmpty) return 'Labels'
          if (selectedItems.length === 1) return selectedItems[0].name
          return `${selectedItems.length} labels`
        }}
        menuMinWidth={220}
        menuFooter={
          <button
            type='button'
            className='btn btn-ghost btn-sm'
            style={{
              width: '100%',
              justifyContent: 'flex-start',
            }}
            onClick={e => {
              e.stopPropagation()
              setPickerOpen(false)
              setCreateOpen(true)
            }}
          >
            <FigmaIcon name='plus' size={16} />
            Create label
          </button>
        }
      />
      <LabelModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        label={null}
      />
    </>
  )
}

export default LabelsPickerField
