import { Box } from '@mui/joy'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { hasActiveFamilyCircle } from '../../navigation/navModel'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { pageShellSx } from '../../theme/appLayout'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import FigmaShoppingScreen from './FigmaShoppingScreen'
import { canEditShoppingItems, isCircleList } from './shoppingListModel'
import {
  useClearCompletedShoppingItems,
  useCreateShoppingListItem,
  useDeleteShoppingListItem,
  useShoppingList,
  useShoppingLists,
  useUpdateShoppingListItem,
} from './ShoppingListQueries'
import { listFigma } from './shoppingViewModel'

const ShoppingListDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation(['shoppingLists', 'common'])
  const { data: profile } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const { data, isError, isLoading, refetch } = useShoppingList(id)
  const { data: allLists = [] } = useShoppingLists()
  const createItem = useCreateShoppingListItem(id)
  const updateItem = useUpdateShoppingListItem(id)
  const deleteItem = useDeleteShoppingListItem(id)
  const clearCompleted = useClearCompletedShoppingItems(id)

  const [confirmationModel, setConfirmationModel] = useState({})

  const isSolo = !hasActiveFamilyCircle(profile, membersData)
  const canEdit = data ? canEditShoppingItems(data) : false

  const figmaLists = useMemo(() => {
    if (!data) return []
    return allLists.map(list => {
      if (String(list.id) === String(id)) {
        const figma = listFigma(list, data.items)
        figma.name = data.name
        return figma
      }
      return listFigma(list)
    })
  }, [allLists, data, id])

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
      <FigmaShoppingScreen
        activeId={String(data.id)}
        canEdit={canEdit}
        headerSubtitle={
          isCircleList(data)
            ? t('shoppingLists:scopeFamily')
            : t('shoppingLists:scopePersonal')
        }
        headerTitle={data.name}
        isSolo={isSolo}
        lists={figmaLists}
        onAddItem={name => createItem.mutateAsync({ name })}
        onClearDone={() =>
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
        onDeleteItem={item => deleteItem.mutate(item.id)}
        onEditItem={(item, text) =>
          updateItem.mutateAsync({ itemId: item.id, name: text })
        }
        onInviteMembers={() => navigate('/family')}
        onNewList={() => navigate('/shopping')}
        onSelectList={listId => navigate(`/shopping/${listId}`)}
        onToggleItem={item =>
          updateItem.mutateAsync({
            itemId: item.id,
            isChecked: !item.done,
          })
        }
      />

      <ConfirmationModal config={confirmationModel} />
    </Box>
  )
}

export default ShoppingListDetail
