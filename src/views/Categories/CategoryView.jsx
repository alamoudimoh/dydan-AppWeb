import {
  AddRounded,
  ArchiveRounded,
  EditRounded,
  UnarchiveRounded,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  Input,
  Stack,
  Typography,
} from '@mui/joy'
import { useEffect, useState } from 'react'

import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import {
  useCategories,
  useCategoryActions,
} from '../../queries/CategoryQueries'
import {
  inlineErrorAlertSx,
  listPageContainerSx,
  pageStackSpacing,
} from '../../theme/appLayout'

const CategoryView = () => {
  const { data: categories = [], isError, isLoading } = useCategories(true)
  const actions = useCategoryActions()
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  useEffect(() => setName(editing?.name || ''), [editing])
  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Category name is required')
    try {
      const response = editing?.id
        ? await actions.update.mutateAsync({ id: editing.id, name: trimmed })
        : await actions.create.mutateAsync({ name: trimmed })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Unable to save category')
      }
      setEditing(null)
      setName('')
      setError('')
    } catch (reason) {
      setError(reason.message)
    }
  }

  if (isLoading) {
    return <QueryLoadingView />
  }

  return (
    <Container maxWidth='md' sx={listPageContainerSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          sx={{ px: 2 }}
          title='Categories'
          subtitle='Organize your Circle’s tasks and Assets in your own language.'
        />
        <SectionCard
          title={editing?.id ? 'Rename category' : 'Create category'}
        >
          <FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
              <Input
                value={name}
                onChange={event => setName(event.target.value)}
                slotProps={{ input: { maxLength: 80, dir: 'auto' } }}
                placeholder='Category name'
              />
              <Button
                startDecorator={editing?.id ? <EditRounded /> : <AddRounded />}
                onClick={save}
              >
                Save
              </Button>
              {editing && (
                <Button
                  variant='plain'
                  color='neutral'
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </FormControl>
          {error && (
            <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
              {error}
            </Alert>
          )}
        </SectionCard>
        {isError && (
          <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
            Categories could not be loaded.
          </Alert>
        )}
        {!isLoading && categories.length === 0 && (
          <SectionCard>
            <Typography>
              No categories yet. Create your first category above.
            </Typography>
          </SectionCard>
        )}
        {categories.map(category => (
          <SectionCard key={category.id}>
            <Stack
              direction='row'
              alignItems='center'
              justifyContent='space-between'
              gap={1}
            >
              <Box>
                <Typography dir='auto' level='title-md'>
                  {category.name}
                </Typography>
                <Typography level='body-xs' color='neutral'>
                  {category.archivedAt ? 'Archived' : 'Active'}
                </Typography>
              </Box>
              <Stack direction='row'>
                <IconButton
                  aria-label={`Rename ${category.name}`}
                  onClick={() => setEditing(category)}
                >
                  <EditRounded />
                </IconButton>
                <IconButton
                  aria-label={`${category.archivedAt ? 'Reactivate' : 'Archive'} ${category.name}`}
                  onClick={() =>
                    actions.archive.mutate({
                      id: category.id,
                      archived: !category.archivedAt,
                    })
                  }
                >
                  {category.archivedAt ? (
                    <UnarchiveRounded />
                  ) : (
                    <ArchiveRounded />
                  )}
                </IconButton>
              </Stack>
            </Stack>
          </SectionCard>
        ))}
      </Stack>
    </Container>
  )
}

export default CategoryView
