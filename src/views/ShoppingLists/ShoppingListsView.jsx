import { Add, Edit, MoreVert, ShoppingCart } from '@mui/icons-material'
import {
  Box,
  Card,
  Chip,
  Dropdown,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { hasActiveFamilyCircle } from '../../navigation/navModel'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { pageShellSx, sectionCardSx } from '../../theme/appLayout'
import { resolveEffectiveRole } from '../../utils/PermissionModel'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import ShoppingListModal from '../Modals/Inputs/ShoppingListModal'
import FigmaShoppingScreen from './FigmaShoppingScreen'
import {
  canManageShoppingList,
  partitionShoppingLists,
  SHOPPING_LIST_SCOPES,
} from './shoppingListModel'
import {
  useArchiveShoppingList,
  useDeleteShoppingList,
  useShoppingLists,
} from './ShoppingListQueries'
import { listFigma } from './shoppingViewModel'

const ListCard = ({
  canManage,
  list,
  onArchive,
  onDelete,
  onOpen,
  onRename,
}) => {
  const { t } = useTranslation('shoppingLists')
  const remaining = Math.max(
    0,
    (list.itemCount || 0) - (list.checkedCount || 0),
  )

  return (
    <Card
      variant='outlined'
      sx={{
        ...sectionCardSx,
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.outlinedBorder' },
      }}
      onClick={onOpen}
    >
      <Stack direction='row' alignItems='center' spacing={1.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            sx={{ mb: 0.5 }}
          >
            <Typography level='title-md' noWrap>
              {list.name}
            </Typography>
            <Chip
              size='sm'
              variant='soft'
              color={list.circleId ? 'primary' : 'neutral'}
            >
              {list.circleId ? t('scopeFamily') : t('scopePersonal')}
            </Chip>
          </Stack>
          <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
            {t('itemsRemaining', { count: remaining })}
            {list.checkedCount > 0
              ? ` · ${t('itemsChecked', { count: list.checkedCount })}`
              : ''}
          </Typography>
        </Box>
        {canManage && (
          <Dropdown>
            <MenuButton
              slots={{ root: IconButton }}
              slotProps={{
                root: { size: 'sm', variant: 'plain', color: 'neutral' },
              }}
              onClick={event => event.stopPropagation()}
            >
              <MoreVert />
            </MenuButton>
            <Menu
              placement='bottom-end'
              onClick={event => event.stopPropagation()}
            >
              <MenuItem onClick={onRename}>
                <Edit fontSize='small' /> {t('renameList')}
              </MenuItem>
              <MenuItem onClick={onArchive}>{t('archiveList')}</MenuItem>
              <MenuItem color='danger' onClick={onDelete}>
                {t('deleteList')}
              </MenuItem>
            </Menu>
          </Dropdown>
        )}
      </Stack>
    </Card>
  )
}

const ShoppingListsView = () => {
  const { t } = useTranslation(['shoppingLists', 'common'])
  const navigate = useNavigate()
  const { data: profile } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const { data: lists = [], isError, isLoading, refetch } = useShoppingLists()
  const archiveList = useArchiveShoppingList()
  const deleteList = useDeleteShoppingList()

  const [legacyMode] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalScope, setModalScope] = useState(SHOPPING_LIST_SCOPES.PERSONAL)
  const [editingList, setEditingList] = useState(null)
  const [confirmationModel, setConfirmationModel] = useState({})

  const hasFamilyCircle = hasActiveFamilyCircle(profile, membersData)
  const effectiveRole = resolveEffectiveRole(profile, membersData)
  const isSolo = !hasFamilyCircle
  const { family, personal } = useMemo(
    () => partitionShoppingLists(lists),
    [lists],
  )

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
  const openEdit = list => {
    setEditingList(list)
    setModalScope(
      list.circleId
        ? SHOPPING_LIST_SCOPES.CIRCLE
        : SHOPPING_LIST_SCOPES.PERSONAL,
    )
    setModalOpen(true)
  }

  if (isLoading) {
    return <QueryLoadingView />
  }

  if (isError) {
    return (
      <Box sx={pageShellSx}>
        <EmptyState
          variant='error'
          size='sm'
          title={t('shoppingLists:loadError')}
          description={t('common:errors.pleaseTryAgain')}
          primaryAction={{ label: t('common:retry'), onClick: () => refetch() }}
        />
      </Box>
    )
  }

  return (
    <Box sx={pageShellSx}>
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

      {legacyMode && (
        <>
          <Stack spacing={3}>
            <Box>
              <Typography level='title-sm' sx={{ mb: 1.5 }}>
                {t('shoppingLists:personalSection')}
              </Typography>
              <Stack spacing={1.5}>
                {personal.length === 0 ? (
                  <EmptyState
                    variant='empty'
                    size='sm'
                    icon={<ShoppingCart />}
                    title={t('shoppingLists:emptyPersonalTitle')}
                    description={t('shoppingLists:emptyPersonalDescription')}
                    primaryAction={{
                      label: t('shoppingLists:createList'),
                      onClick: () => openCreate(),
                      startDecorator: <Add />,
                    }}
                  />
                ) : (
                  personal.map(list => (
                    <ListCard
                      key={list.id}
                      list={list}
                      canManage={canManageShoppingList(
                        list,
                        profile?.id,
                        effectiveRole,
                      )}
                      onOpen={() => navigate(`/shopping/${list.id}`)}
                      onRename={() => openEdit(list)}
                      onArchive={() =>
                        setConfirmationModel({
                          isOpen: true,
                          title: t('shoppingLists:archiveList'),
                          message: t('shoppingLists:archiveListConfirm'),
                          confirmText: t('shoppingLists:archiveList'),
                          onClose: async confirmed => {
                            if (confirmed)
                              await archiveList.mutateAsync(list.id)
                            setConfirmationModel({})
                          },
                        })
                      }
                      onDelete={() =>
                        setConfirmationModel({
                          isOpen: true,
                          title: t('shoppingLists:deleteList'),
                          message: t('shoppingLists:deleteListConfirm'),
                          confirmText: t('shoppingLists:deleteList'),
                          color: 'danger',
                          onClose: async confirmed => {
                            if (confirmed) await deleteList.mutateAsync(list.id)
                            setConfirmationModel({})
                          },
                        })
                      }
                    />
                  ))
                )}
              </Stack>
            </Box>

            {hasFamilyCircle && (
              <Box>
                <Typography level='title-sm' sx={{ mb: 0.5 }}>
                  {t('shoppingLists:familySection')}
                </Typography>
                <Typography
                  level='body-sm'
                  sx={{ color: 'text.secondary', mb: 1.5 }}
                >
                  {t('shoppingLists:familyHint')}
                </Typography>
                <Stack spacing={1.5}>
                  {family.length === 0 ? (
                    <EmptyState
                      variant='empty'
                      size='sm'
                      icon={<ShoppingCart />}
                      title={t('shoppingLists:emptyFamilyTitle')}
                      description={t('shoppingLists:emptyFamilyDescription')}
                      primaryAction={{
                        label: t('shoppingLists:createList'),
                        onClick: () => openCreate(SHOPPING_LIST_SCOPES.CIRCLE),
                        startDecorator: <Add />,
                      }}
                    />
                  ) : (
                    family.map(list => (
                      <ListCard
                        key={list.id}
                        list={list}
                        canManage={canManageShoppingList(
                          list,
                          profile?.id,
                          effectiveRole,
                        )}
                        onOpen={() => navigate(`/shopping/${list.id}`)}
                        onRename={() => openEdit(list)}
                        onArchive={() =>
                          setConfirmationModel({
                            isOpen: true,
                            title: t('shoppingLists:archiveList'),
                            message: t('shoppingLists:archiveListConfirm'),
                            confirmText: t('shoppingLists:archiveList'),
                            onClose: async confirmed => {
                              if (confirmed)
                                await archiveList.mutateAsync(list.id)
                              setConfirmationModel({})
                            },
                          })
                        }
                        onDelete={() =>
                          setConfirmationModel({
                            isOpen: true,
                            title: t('shoppingLists:deleteList'),
                            message: t('shoppingLists:deleteListConfirm'),
                            confirmText: t('shoppingLists:deleteList'),
                            color: 'danger',
                            onClose: async confirmed => {
                              if (confirmed)
                                await deleteList.mutateAsync(list.id)
                              setConfirmationModel({})
                            },
                          })
                        }
                      />
                    ))
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </>
      )}

      <ConfirmationModal config={confirmationModel} />
    </Box>
  )
}

export default ShoppingListsView
