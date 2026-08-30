import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { hasActiveFamilyCircle } from '../../navigation/navModel'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { pageShellSx } from '../../theme/appLayout'
import { sxToStyle } from '../../theme/sxToStyle'
import ShoppingListModal from '../Modals/Inputs/ShoppingListModal'
import FigmaShoppingScreen from './FigmaShoppingScreen'
import { SHOPPING_LIST_SCOPES } from './shoppingListModel'
import { useShoppingLists } from './ShoppingListQueries'
import { listFigma } from './shoppingViewModel'

const ShoppingListsView = () => {
  const { t } = useTranslation(['shoppingLists', 'common'])
  const navigate = useNavigate()
  const { data: profile } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const { data: lists = [], isError, isLoading, refetch } = useShoppingLists()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalScope, setModalScope] = useState(SHOPPING_LIST_SCOPES.PERSONAL)
  const [editingList, setEditingList] = useState(null)

  const hasFamilyCircle = hasActiveFamilyCircle(profile, membersData)
  const isSolo = !hasFamilyCircle

  const figmaLists = useMemo(() => lists.map(list => listFigma(list)), [lists])

  const openCreate = scope => {
    setEditingList(null)
    setModalScope(
      scope ??
        (hasFamilyCircle
          ? SHOPPING_LIST_SCOPES.CIRCLE
          : SHOPPING_LIST_SCOPES.PERSONAL),
    )
    setModalOpen(true)
  }

  if (isLoading) {
    return <QueryLoadingView />
  }

  if (isError) {
    return (
      <div style={sxToStyle(pageShellSx)}>
        <EmptyState
          variant='error'
          size='sm'
          title={t('shoppingLists:loadError')}
          description={t('common:errors.pleaseTryAgain')}
          primaryAction={{ label: t('common:retry'), onClick: () => refetch() }}
        />
      </div>
    )
  }

  return (
    <div style={sxToStyle(pageShellSx)}>
      <FigmaShoppingScreen
        activeId={null}
        canEdit={false}
        headerSubtitle={
          isSolo
            ? t('shoppingLists:overviewSubtitleSolo')
            : t('shoppingLists:overviewSubtitleFamily')
        }
        headerTitle={t('shoppingLists:title')}
        isSolo={isSolo}
        lists={figmaLists}
        onInviteMembers={() => navigate('/family')}
        onNewList={openCreate}
        onSelectList={id => navigate(`/shopping/${id}`)}
      />

      <ShoppingListModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingList(null)
        }}
        scope={modalScope}
        list={editingList}
      />
    </div>
  )
}

export default ShoppingListsView
