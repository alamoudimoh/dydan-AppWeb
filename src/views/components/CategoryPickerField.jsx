import { AddRounded } from '@mui/icons-material'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
  Typography,
} from '@mui/joy'
import { useState } from 'react'

import {
  useCategories,
  useCategoryActions,
} from '../../queries/CategoryQueries'

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
      onChange(body.res.id)
      setName('')
      setCreating(false)
      setError('')
    } catch (reason) {
      setError(reason.message)
    }
  }
  return (
    <FormControl>
      <FormLabel>Category</FormLabel>
      <Select
        value={value || null}
        placeholder={sorted.length ? 'Select category' : 'No categories yet'}
        onChange={(_, next) => onChange(next)}
      >
        <Option value={null}>Uncategorized</Option>
        {sorted.map(category => (
          <Option key={category.id} value={category.id}>
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
    </FormControl>
  )
}

export default CategoryPickerField
