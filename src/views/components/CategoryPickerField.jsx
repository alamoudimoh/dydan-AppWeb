import { AddRounded } from '@mui/icons-material'
import {
  Button,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
  Typography,
} from '@mui/joy'
import PropTypes from 'prop-types'
import { useState } from 'react'

import { Z_INDEX } from '../../constants/zIndex'
import {
  useCategories,
  useCategoryActions,
} from '../../queries/CategoryQueries'

const UNCATEGORIZED_VALUE = 'uncategorized'

const CategoryPickerField = ({ onChange, value }) => {
  const { data: categories = [] } = useCategories()
  const { create } = useCategoryActions()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
  const sorted = [...categories].sort((a, b) =>
    collator.compare(a.name, b.name),
  )
  const selectedId =
    value === null || value === undefined ? null : Number(value)
  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Category name is required')
    if (categories.some(item => collator.compare(item.name, trimmed) === 0))
      return setError('Category already exists')
    try {
      const response = await create.mutateAsync({ name: trimmed })
      const body = await response.json()
      if (!response.ok)
        throw new Error(body.error || 'Unable to create category')
      onChange(Number(body.res.id))
      setName('')
      setCreating(false)
      setError('')
    } catch (reason) {
      setError(reason.message)
    }
  }
  return (
    <Stack spacing={1}>
      <FormLabel>Category</FormLabel>
      <Select
        aria-label='Category'
        value={selectedId ?? UNCATEGORIZED_VALUE}
        placeholder={sorted.length ? 'Select category' : 'No categories yet'}
        onChange={(_, next) =>
          onChange(
            next === UNCATEGORIZED_VALUE || next === null || next === undefined
              ? null
              : Number(next),
          )
        }
        slotProps={{
          listbox: {
            sx: {
              maxWidth: 'calc(100vw - 24px)',
              zIndex: Z_INDEX.MODAL_POPOVER,
            },
          },
        }}
      >
        <Option value={UNCATEGORIZED_VALUE}>Uncategorized</Option>
        {sorted.map(category => (
          <Option key={category.id} value={Number(category.id)}>
            {category.name}
          </Option>
        ))}
      </Select>
      {!creating ? (
        <Button
          variant='plain'
          color='neutral'
          size='sm'
          startDecorator={<AddRounded />}
          onClick={() => setCreating(true)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Create new category
        </Button>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mt={1}>
          <Input
            autoFocus
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder='Category name'
            slotProps={{ input: { maxLength: 80, dir: 'auto' } }}
          />
          <Button loading={create.isPending} onClick={save}>
            Create
          </Button>
          <Button
            variant='plain'
            color='neutral'
            onClick={() => setCreating(false)}
          >
            Cancel
          </Button>
        </Stack>
      )}
      {error && (
        <Typography color='danger' level='body-sm'>
          {error}
        </Typography>
      )}
    </Stack>
  )
}

CategoryPickerField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

export default CategoryPickerField
