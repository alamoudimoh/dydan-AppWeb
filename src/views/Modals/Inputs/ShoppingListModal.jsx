import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from '@mui/joy'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'
import {
  useCreateShoppingList,
  useUpdateShoppingList,
} from '../../ShoppingLists/ShoppingListQueries'
import { SHOPPING_LIST_SCOPES } from '../../ShoppingLists/shoppingListModel'

const ShoppingListModal = ({ open, onClose, scope, list }) => {
  const { t } = useTranslation(['shoppingLists', 'common'])
  const { ResponsiveModal } = useResponsiveModal()
  const [name, setName] = useState('')
  const createList = useCreateShoppingList()
  const updateList = useUpdateShoppingList()

  useEffect(() => {
    if (open) {
      setName(list?.name || '')
    }
  }, [open, list])

  const handleSubmit = async event => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    if (list) {
      await updateList.mutateAsync({ id: list.id, name: trimmed })
    } else {
      await createList.mutateAsync({ name: trimmed, scope })
    }
    onClose()
  }

  const isFamily = scope === SHOPPING_LIST_SCOPES.CIRCLE

  return (
    <ResponsiveModal open={open} onClose={onClose} size='sm'>
      <Typography level='h4' sx={{ mb: 2 }}>
        {list
          ? t('renameList')
          : isFamily
            ? t('createFamily')
            : t('createPersonal')}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>{t('listName')}</FormLabel>
            <Input
              autoFocus
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder={t('listNamePlaceholder')}
            />
          </FormControl>
          {isFamily && !list && (
            <Box>
              <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                {t('familyHint')}
              </Typography>
            </Box>
          )}
          <ModalActions>
            <Button variant='plain' color='neutral' onClick={onClose}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' loading={createList.isPending || updateList.isPending}>
              {list ? t('renameList') : t('createList')}
            </Button>
          </ModalActions>
        </Stack>
      </form>
    </ResponsiveModal>
  )
}

export default ShoppingListModal
