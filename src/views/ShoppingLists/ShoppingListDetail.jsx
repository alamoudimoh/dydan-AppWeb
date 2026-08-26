import { ArrowBack, DeleteOutline, ShoppingCart } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemDecorator,
  Stack,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { pageShellSx, sectionCardSx } from '../../theme/appLayout'
import { resolveEffectiveRole } from '../../utils/PermissionModel'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import {
  canEditShoppingItems,
  canManageShoppingList,
  isCircleList,
} from './shoppingListModel'
import {
  useClearCompletedShoppingItems,
  useCreateShoppingListItem,
  useDeleteShoppingListItem,
  useShoppingList,
  useUpdateShoppingListItem,
} from './ShoppingListQueries'

const ShoppingListDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation(['shoppingLists', 'common'])
  const { data: profile } = useUserProfile()
  const { data: members = [] } = useCircleMembers()
  const { data, isError, isLoading, refetch } = useShoppingList(id)
  const createItem = useCreateShoppingListItem(id)
  const updateItem = useUpdateShoppingListItem(id)
  const deleteItem = useDeleteShoppingListItem(id)
  const clearCompleted = useClearCompletedShoppingItems(id)

  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [confirmationModel, setConfirmationModel] = useState({})

  const effectiveRole = resolveEffectiveRole(profile, members)
  const canManage = data
    ? canManageShoppingList(data, profile?.id, effectiveRole)
    : false
  const canEdit = data ? canEditShoppingItems(data) : false

  const { activeItems, completedItems } = useMemo(() => {
    const items = data?.items || []
    return {
      activeItems: items.filter(item => !item.isChecked),
      completedItems: items.filter(item => item.isChecked),
    }
  }, [data?.items])

  const handleAddItem = async event => {
    event.preventDefault()
    const name = itemName.trim()
    if (!name) return
    await createItem.mutateAsync({
      name,
      quantity: quantity.trim() ? quantity.trim() : undefined,
    })
    setItemName('')
    setQuantity('')
  }

  const toggleItem = async item => {
    await updateItem.mutateAsync({
      itemId: item.id,
      isChecked: !item.isChecked,
    })
  }

  if (isLoading) {
    return <QueryLoadingView />
  }

  if (isError || !data) {
    return (
      <Box sx={pageShellSx}>
        <EmptyState
          variant='error'
          size='sm'
          title={t('shoppingLists:detailLoadError')}
          description={t('common:errors.pleaseTryAgain')}
          primaryAction={{
            label: t('common:retry'),
            onClick: () => refetch(),
          }}
          secondaryAction={{
            label: t('shoppingLists:backToLists'),
            to: '/shopping',
          }}
        />
      </Box>
    )
  }

  return (
    <Box sx={pageShellSx}>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
        <IconButton
          component={RouterLink}
          to='/shopping'
          variant='plain'
          color='neutral'
          aria-label={t('shoppingLists:backToLists')}
        >
          <ArrowBack />
        </IconButton>
        <Chip
          size='sm'
          variant='soft'
          color={isCircleList(data) ? 'primary' : 'neutral'}
        >
          {isCircleList(data)
            ? t('shoppingLists:scopeFamily')
            : t('shoppingLists:scopePersonal')}
        </Chip>
      </Stack>

      <PageHeader title={data.name} subtitle={t('shoppingLists:subtitle')} />

      {canEdit && (
        <Box
          component='form'
          onSubmit={handleAddItem}
          sx={{ ...sectionCardSx, mb: 2 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <FormControl sx={{ flex: 1 }}>
              <Input
                value={itemName}
                onChange={event => setItemName(event.target.value)}
                placeholder={t('shoppingLists:itemPlaceholder')}
              />
            </FormControl>
            <FormControl sx={{ width: { xs: '100%', sm: 96 } }}>
              <Input
                value={quantity}
                onChange={event => setQuantity(event.target.value)}
                placeholder={t('shoppingLists:quantityPlaceholder')}
              />
            </FormControl>
            <Button type='submit' loading={createItem.isPending}>
              {t('shoppingLists:addItem')}
            </Button>
          </Stack>
        </Box>
      )}

      {activeItems.length === 0 && completedItems.length === 0 ? (
        <EmptyState
          variant='empty'
          icon={<ShoppingCart />}
          title={t('shoppingLists:emptyItemsTitle')}
          description={t('shoppingLists:emptyItemsDescription')}
        />
      ) : (
        <Stack spacing={2}>
          <List sx={{ ...sectionCardSx, p: 0 }}>
            {activeItems.map(item => (
              <ListItem key={item.id} sx={{ py: 1.25 }}>
                <ListItemDecorator>
                  <Checkbox
                    checked={item.isChecked}
                    onChange={() => toggleItem(item)}
                    disabled={!canEdit || updateItem.isPending}
                  />
                </ListItemDecorator>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography level='body-md'>{item.name}</Typography>
                  {item.quantity && (
                    <Typography
                      level='body-xs'
                      sx={{ color: 'text.secondary' }}
                    >
                      {item.quantity}
                    </Typography>
                  )}
                </Box>
                {canEdit && (
                  <IconButton
                    size='sm'
                    variant='plain'
                    color='danger'
                    onClick={() => deleteItem.mutate(item.id)}
                    aria-label={t('common:delete')}
                  >
                    <DeleteOutline />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>

          {completedItems.length > 0 && (
            <Box>
              <Stack
                direction='row'
                alignItems='center'
                justifyContent='space-between'
                sx={{ mb: 1 }}
              >
                <Typography level='title-sm'>
                  {t('shoppingLists:itemsChecked', {
                    count: completedItems.length,
                  })}
                </Typography>
                {canEdit && (
                  <Button
                    size='sm'
                    variant='plain'
                    onClick={() =>
                      setConfirmationModel({
                        isOpen: true,
                        title: t('shoppingLists:clearCompleted'),
                        message: t('shoppingLists:clearCompletedConfirm'),
                        confirmText: t('shoppingLists:clearCompleted'),
                        onClose: async confirmed => {
                          if (confirmed) await clearCompleted.mutateAsync()
                          setConfirmationModel({})
                        },
                      })
                    }
                  >
                    {t('shoppingLists:clearCompleted')}
                  </Button>
                )}
              </Stack>
              <List sx={{ ...sectionCardSx, p: 0, opacity: 0.85 }}>
                {completedItems.map(item => (
                  <ListItem key={item.id} sx={{ py: 1.25 }}>
                    <ListItemDecorator>
                      <Checkbox
                        checked
                        onChange={() => toggleItem(item)}
                        disabled={!canEdit || updateItem.isPending}
                      />
                    </ListItemDecorator>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        level='body-md'
                        sx={{
                          textDecoration: 'line-through',
                          color: 'text.secondary',
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                    {canEdit && (
                      <IconButton
                        size='sm'
                        variant='plain'
                        color='danger'
                        onClick={() => deleteItem.mutate(item.id)}
                        aria-label={t('common:delete')}
                      >
                        <DeleteOutline />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      )}

      {canManage && (
        <Stack direction='row' spacing={1} sx={{ mt: 3 }}>
          <Button variant='outlined' onClick={() => navigate('/shopping')}>
            {t('shoppingLists:backToLists')}
          </Button>
        </Stack>
      )}

      <ConfirmationModal config={confirmationModel} />
    </Box>
  )
}

export default ShoppingListDetail
