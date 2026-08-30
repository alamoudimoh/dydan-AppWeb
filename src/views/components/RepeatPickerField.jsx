import moment from 'moment'
import { useEffect, useId, useState } from 'react'

import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import { useResponsiveModal } from '../../hooks/useResponsiveModal'
import { getRecurrentChipText } from '../../utils/ChoreCardHelpers'

const FREQUENCY_TYPES = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'adaptive',
  'custom',
]
const REPEAT_ON_TYPE = ['interval', 'days_of_the_week', 'day_of_the_month']

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const OCCURRENCE_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: -1, label: 'Last' },
]

const defaultMetadata = () => ({
  unit: 'days',
  time: moment(moment(new Date()).format('YYYY-MM-DD') + 'T18:00').format(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const initLocalState = value => {
  if (!value) {
    return {
      frequencyType: 'daily',
      frequency: 1,
      frequencyMetadata: defaultMetadata(),
    }
  }

  let { frequency, frequencyMetadata, frequencyType } = value

  // Normalize parser output: interval/1/days -> daily, etc.
  if (frequencyType === 'interval' && frequency === 1) {
    const unitTypeMap = {
      days: 'daily',
      weeks: 'weekly',
      months: 'monthly',
      years: 'yearly',
    }
    frequencyType = unitTypeMap[frequencyMetadata?.unit] || frequencyType
  }

  return {
    frequencyType,
    frequency: frequency ?? 1,
    frequencyMetadata: {
      ...defaultMetadata(),
      ...frequencyMetadata,
    },
  }
}

const getDisplayType = frequencyType =>
  REPEAT_ON_TYPE.includes(frequencyType) ? 'custom' : frequencyType

const sectionLabelStyle = {
  color: 'var(--t-muted)',
  font: '600 11px/1.2 var(--font-ui)',
  letterSpacing: '0.05em',
  margin: '0 0 6px',
  textTransform: 'uppercase',
}

const optionListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const inputStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--t-primary)',
  font: '14px var(--font-ui)',
  minHeight: 32,
  padding: '4px 8px',
}

const SectionLabel = ({ children }) => (
  <p style={sectionLabelStyle}>{children}</p>
)

const ChoiceCheckbox = ({ checked, label, onChange }) => (
  <label
    style={{
      alignItems: 'center',
      background: checked ? 'var(--surface-2)' : 'var(--surface)',
      border: `1px solid ${checked ? 'var(--brand)' : 'var(--line)'}`,
      borderRadius: 'var(--r-full)',
      color: 'var(--t-primary)',
      cursor: 'pointer',
      display: 'inline-flex',
      font: '500 13px var(--font-ui)',
      gap: 6,
      minHeight: 32,
      padding: '4px 10px',
    }}
  >
    <input
      type='checkbox'
      checked={checked}
      onChange={onChange}
      style={{ accentColor: 'var(--brand)', margin: 0 }}
    />
    {label}
  </label>
)

const SegmentedRadio = ({ checked, label, name, onChange, value }) => (
  <label
    style={{
      alignItems: 'center',
      background: checked ? 'var(--surface)' : 'transparent',
      borderRadius: 'var(--r-sm)',
      boxShadow: checked ? 'var(--shadow-sm)' : 'none',
      color: 'var(--t-primary)',
      cursor: 'pointer',
      display: 'inline-flex',
      font: '500 13px var(--font-ui)',
      gap: 6,
      minHeight: 30,
      padding: '2px 10px',
    }}
  >
    <input
      type='radio'
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      style={{ accentColor: 'var(--brand)', margin: 0 }}
    />
    {label}
  </label>
)

const TimeRow = ({ metadata, onUpdate }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    }}
  >
    <SectionLabel>Time of day</SectionLabel>
    <input
      type='time'
      value={moment(metadata?.time).format('HH:mm')}
      onChange={e =>
        onUpdate({
          ...metadata,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          time: moment(
            moment(new Date()).format('YYYY-MM-DD') + 'T' + e.target.value,
          ).format(),
        })
      }
      style={{ ...inputStyle, width: 120 }}
    />
  </div>
)

const IntervalSection = ({
  frequency,
  frequencyMetadata,
  onFrequencyMetadataUpdate,
  onFrequencyUpdate,
}) => (
  <div>
    <SectionLabel>Repeat every</SectionLabel>
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <input
        type='number'
        min={1}
        max={999}
        value={frequency}
        onChange={e =>
          onFrequencyUpdate(Math.max(1, parseInt(e.target.value, 10) || 1))
        }
        style={{ ...inputStyle, width: 72 }}
      />
      <div style={optionListStyle}>
        {['days', 'weeks', 'months', 'years'].map(unit => (
          <ChoiceCheckbox
            key={unit}
            checked={frequencyMetadata?.unit === unit}
            onChange={() =>
              onFrequencyMetadataUpdate({ ...frequencyMetadata, unit })
            }
            label={unit.charAt(0).toUpperCase() + unit.slice(1)}
          />
        ))}
      </div>
    </div>
    <TimeRow
      metadata={frequencyMetadata}
      onUpdate={onFrequencyMetadataUpdate}
    />
  </div>
)

const DaysOfWeekSection = ({
  frequencyMetadata,
  onFrequencyMetadataUpdate,
}) => {
  const patternId = useId()
  const selectedDays = frequencyMetadata?.days || []
  const weekPattern = frequencyMetadata?.weekPattern || 'every_week'
  const selectedOccurrences = frequencyMetadata?.occurrences || []

  const toggleDay = day => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    onFrequencyMetadataUpdate({ ...frequencyMetadata, days: next })
  }

  const toggleOccurrence = val => {
    const next = selectedOccurrences.includes(val)
      ? selectedOccurrences.filter(v => v !== val)
      : [...selectedOccurrences, val]
    onFrequencyMetadataUpdate({ ...frequencyMetadata, occurrences: next })
  }

  return (
    <div>
      <SectionLabel>Days</SectionLabel>
      <div style={optionListStyle}>
        {DAYS.map(day => (
          <ChoiceCheckbox
            key={day}
            checked={selectedDays.includes(day)}
            onChange={() => toggleDay(day)}
            label={day.charAt(0).toUpperCase() + day.slice(1, 3)}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionLabel>Pattern</SectionLabel>
        <div
          role='radiogroup'
          aria-label='Repeat pattern'
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
            display: 'inline-flex',
            gap: 3,
            padding: 3,
          }}
        >
          {[
            { value: 'every_week', label: 'Every week' },
            { value: 'week_of_month', label: 'Specific weeks' },
          ].map(option => (
            <SegmentedRadio
              key={option.value}
              name={patternId}
              value={option.value}
              checked={weekPattern === option.value}
              label={option.label}
              onChange={e =>
                onFrequencyMetadataUpdate({
                  ...frequencyMetadata,
                  weekPattern: e.target.value,
                  occurrences:
                    e.target.value === 'every_week' ? [] : selectedOccurrences,
                })
              }
            />
          ))}
        </div>
      </div>

      {weekPattern === 'week_of_month' && (
        <div style={{ marginTop: 12 }}>
          <SectionLabel>Occurrences</SectionLabel>
          <div style={optionListStyle}>
            {OCCURRENCE_OPTIONS.map(option => (
              <ChoiceCheckbox
                key={option.value}
                checked={selectedOccurrences.includes(option.value)}
                onChange={() => toggleOccurrence(option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>
      )}

      <TimeRow
        metadata={frequencyMetadata}
        onUpdate={onFrequencyMetadataUpdate}
      />
    </div>
  )
}

const DayOfMonthSection = ({
  frequency,
  frequencyMetadata,
  onFrequencyMetadataUpdate,
  onFrequencyUpdate,
}) => {
  const selectedMonths = frequencyMetadata?.months || []

  const toggleMonth = month => {
    const next = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month]
    onFrequencyMetadataUpdate({ ...frequencyMetadata, months: next })
  }

  return (
    <div>
      <SectionLabel>Months</SectionLabel>
      <div style={optionListStyle}>
        {MONTHS.map(month => (
          <ChoiceCheckbox
            key={month}
            checked={selectedMonths.includes(month)}
            onChange={() => toggleMonth(month)}
            label={month.charAt(0).toUpperCase() + month.slice(1, 3)}
          />
        ))}
      </div>

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 16,
        }}
      >
        <SectionLabel>Day of month</SectionLabel>
        <input
          type='number'
          min={1}
          max={31}
          value={frequency}
          onChange={e => {
            const nextValue = Math.min(
              31,
              Math.max(1, parseInt(e.target.value, 10) || 1),
            )
            onFrequencyUpdate(nextValue)
          }}
          style={{ ...inputStyle, width: 72 }}
        />
      </div>

      <TimeRow
        metadata={frequencyMetadata}
        onUpdate={onFrequencyMetadataUpdate}
      />
    </div>
  )
}

const RepeatPickerField = ({
  emptyDisplay = 'icon-text',
  onChange,
  onClear,
  size = 'sm',
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localFrequencyType, setLocalFrequencyType] = useState('daily')
  const [localFrequency, setLocalFrequency] = useState(1)
  const [localFrequencyMetadata, setLocalFrequencyMetadata] =
    useState(defaultMetadata)
  const scheduleTypeId = useId()
  const { ResponsiveModal } = useResponsiveModal()

  useEffect(() => {
    if (!isOpen) return
    const init = initLocalState(value)
    setLocalFrequencyType(init.frequencyType)
    setLocalFrequency(init.frequency)
    setLocalFrequencyMetadata(init.frequencyMetadata)
  }, [isOpen, value])

  const hasRepeat = Boolean(value)
  const shouldShowLabel = hasRepeat || emptyDisplay === 'icon-text'
  const displayLabel = hasRepeat ? getRecurrentChipText(value) : 'Repeat'
  const displayType = getDisplayType(localFrequencyType)

  const handleTypeSelect = type => {
    if (type === 'custom') {
      setLocalFrequencyType('interval')
      setLocalFrequency(1)
      setLocalFrequencyMetadata({ ...defaultMetadata(), unit: 'days' })
    } else {
      setLocalFrequencyType(type)
      setLocalFrequency(1)
    }
  }

  const handleSubTypeSelect = newType => {
    setLocalFrequencyType(newType)
    if (newType === 'interval') {
      setLocalFrequency(1)
      setLocalFrequencyMetadata(prev => ({ ...prev, unit: 'days' }))
    } else if (newType === 'days_of_the_week') {
      setLocalFrequencyMetadata(prev => ({
        ...prev,
        days: [],
        weekPattern: 'every_week',
        occurrences: [],
      }))
    } else if (newType === 'day_of_the_month') {
      setLocalFrequency(1)
      setLocalFrequencyMetadata(prev => ({ ...prev, months: [] }))
    }
  }

  const handleSave = () => {
    onChange({
      frequencyType: localFrequencyType,
      frequency: localFrequency,
      frequencyMetadata: localFrequencyMetadata,
    })
    setIsOpen(false)
  }

  return (
    <>
      <div
        style={{ alignItems: 'center', display: 'flex', position: 'relative' }}
      >
        <button
          aria-expanded={isOpen}
          aria-haspopup='dialog'
          aria-label={
            hasRepeat ? `Repeat: ${displayLabel}` : 'Set repeat schedule'
          }
          className='btn btn-secondary'
          data-size={size}
          onClick={() => setIsOpen(true)}
          style={{
            alignItems: 'center',
            background: hasRepeat ? 'var(--surface-2)' : 'var(--surface)',
            border: `1px solid ${hasRepeat ? 'transparent' : 'var(--line)'}`,
            borderRadius: 'var(--r-full)',
            color: 'var(--t-primary)',
            display: 'inline-flex',
            fontSize: size === 'lg' ? 15 : size === 'sm' ? 12 : 14,
            gap: shouldShowLabel ? 8 : 0,
            justifyContent: 'flex-start',
            minHeight: 40,
            minWidth: 'min-content',
            padding: shouldShowLabel ? '8px 10px' : '8px 6px',
            transition: 'all 0.25s ease-in-out',
            whiteSpace: 'nowrap',
          }}
          type='button'
        >
          <FigmaIcon name='repeat' size={20} />
          <span
            aria-hidden='true'
            style={{
              maxWidth: shouldShowLabel ? 220 : 0,
              opacity: shouldShowLabel ? 1 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transform: shouldShowLabel ? 'translateX(0)' : 'translateX(-4px)',
              transition:
                'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out, transform 0.25s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            {displayLabel}
          </span>
        </button>

        {hasRepeat && onClear && (
          <button
            aria-label='Clear repeat schedule'
            className='btn btn-danger'
            onClick={e => {
              e.stopPropagation()
              onClear?.()
            }}
            style={{
              alignItems: 'center',
              borderRadius: '50%',
              display: 'inline-flex',
              height: 30,
              justifyContent: 'center',
              padding: 6,
              position: 'absolute',
              right: -18,
              top: -18,
              width: 30,
              zIndex: 10,
            }}
            type='button'
          >
            <FigmaIcon name='x' size={18} />
          </button>
        )}
      </div>

      <ResponsiveModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title='Repeat Schedule'
        footer={
          <ModalActions
            tertiary={
              hasRepeat
                ? {
                    label: 'Remove',
                    color: 'danger',
                    onClick: () => {
                      onClear?.()
                      setIsOpen(false)
                    },
                  }
                : undefined
            }
            secondary={{ label: 'Cancel', onClick: () => setIsOpen(false) }}
            primary={{ label: 'Apply', onClick: handleSave }}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <SectionLabel>Frequency</SectionLabel>
            <div style={optionListStyle}>
              {FREQUENCY_TYPES.map(type => (
                <ChoiceCheckbox
                  key={type}
                  checked={displayType === type}
                  onChange={() => handleTypeSelect(type)}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                />
              ))}
            </div>
          </div>

          {displayType === 'custom' && (
            <>
              <div>
                <SectionLabel>Schedule type</SectionLabel>
                <div
                  role='radiogroup'
                  aria-label='Schedule type'
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                    display: 'inline-flex',
                    gap: 3,
                    padding: 3,
                  }}
                >
                  {REPEAT_ON_TYPE.map(type => (
                    <SegmentedRadio
                      key={type}
                      name={scheduleTypeId}
                      value={type}
                      checked={localFrequencyType === type}
                      label={type
                        .split('_')
                        .map((word, index, words) =>
                          index === 0 || index === words.length - 1
                            ? word.charAt(0).toUpperCase() + word.slice(1)
                            : word,
                        )
                        .join(' ')}
                      onChange={e => handleSubTypeSelect(e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <hr
                style={{
                  border: 0,
                  borderTop: '1px solid var(--line)',
                  margin: 0,
                  width: '100%',
                }}
              />

              {localFrequencyType === 'interval' && (
                <IntervalSection
                  frequency={localFrequency}
                  frequencyMetadata={localFrequencyMetadata}
                  onFrequencyUpdate={setLocalFrequency}
                  onFrequencyMetadataUpdate={setLocalFrequencyMetadata}
                />
              )}
              {localFrequencyType === 'days_of_the_week' && (
                <DaysOfWeekSection
                  frequencyMetadata={localFrequencyMetadata}
                  onFrequencyMetadataUpdate={setLocalFrequencyMetadata}
                />
              )}
              {localFrequencyType === 'day_of_the_month' && (
                <DayOfMonthSection
                  frequency={localFrequency}
                  frequencyMetadata={localFrequencyMetadata}
                  onFrequencyUpdate={setLocalFrequency}
                  onFrequencyMetadataUpdate={setLocalFrequencyMetadata}
                />
              )}
            </>
          )}
        </div>
      </ResponsiveModal>
    </>
  )
}

export default RepeatPickerField
