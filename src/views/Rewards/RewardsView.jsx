import { Add, CardGiftcard, Edit, Inventory2 } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import {
  useAdminRewardRequests,
  useMyRewardRequests,
  useRewardMutation,
  useRewards,
} from '../../queries/RewardQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import {
  inlineErrorAlertSx,
  pageShellSx,
  pageStackSpacing,
} from '../../theme/appLayout'
import { RewardEditor } from './RewardEditor'

const statusColor = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
}

export default function RewardsView() {
  const { i18n, t } = useTranslation('common')
  const locale = i18n.resolvedLanguage || i18n.language
  const { data: profile } = useUserProfile()
  const { data: members } = useCircleMembers()
  const me = members?.res?.find(member => member.userId === profile?.id)
  const isAdmin = me?.role === 'admin'
  const rewards = useRewards(isAdmin)
  const mine = useMyRewardRequests()
  const adminRequests = useAdminRewardRequests(isAdmin)
  const mutation = useRewardMutation()
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const active = useMemo(
    () => rewards.data?.res?.filter(reward => reward.isActive) || [],
    [rewards.data],
  )
  const balance = mine.data?.balance || {
    currentBalance: 0,
    pendingReserved: 0,
    spendableBalance: 0,
  }
  const date = value => (value ? new Date(value).toLocaleString(locale) : '-')
  const act = async (path, message) => {
    if (window.confirm(message)) await mutation.mutateAsync({ path, data: {} })
  }

  if (rewards.isLoading || mine.isLoading) {
    return (
      <Box sx={pageShellSx}>
        <QueryLoadingView label={t('rewards.loading')} />
      </Box>
    )
  }
  if (rewards.isError || mine.isError) {
    return (
      <Box sx={pageShellSx}>
        <EmptyState
          variant='error'
          icon={<CardGiftcard />}
          title={t('rewards.loadError')}
          primaryAction={{
            label: t('retry'),
            onClick: () => {
              void rewards.refetch()
              void mine.refetch()
            },
          }}
        />
      </Box>
    )
  }

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title={t('rewards.title')}
          subtitle={t('rewards.subtitle')}
        />
        {mutation.error && (
          <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
            {mutation.error.message}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {[
            ['rewards.available', balance.currentBalance],
            ['rewards.reserved', balance.pendingReserved],
            ['rewards.spendable', balance.spendableBalance],
          ].map(([label, value]) => (
            <Card variant='soft' key={label}>
              <CardContent>
                <Typography level='body-sm'>{t(label)}</Typography>
                <Typography level='h2' className='daydan-metric'>
                  {t('rewards.points', { count: value })}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ sm: 'center' }}
          gap={1}
        >
          <Typography level='h2'>{t('rewards.availableRewards')}</Typography>
          {isAdmin && (
            <Button startDecorator={<Add />} onClick={() => setCreating(true)}>
              {t('rewards.createReward')}
            </Button>
          )}
        </Stack>
        {!active.length ? (
          <EmptyState
            size='sm'
            icon={<CardGiftcard />}
            title={t('rewards.noRewards')}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {active.map(reward => (
              <Card key={reward.id} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.5} sx={{ height: '100%' }}>
                    <CardGiftcard color='primary' />
                    <Typography level='title-lg'>{reward.name}</Typography>
                    {reward.description && (
                      <Typography level='body-sm'>
                        {reward.description}
                      </Typography>
                    )}
                    <Typography
                      level='h3'
                      className='daydan-metric'
                      sx={{ mt: 'auto' }}
                    >
                      {t('rewards.points', { count: reward.costPoints })}
                    </Typography>
                    <Button
                      disabled={
                        mutation.isPending ||
                        balance.spendableBalance < reward.costPoints
                      }
                      onClick={() =>
                        window.confirm(
                          t('rewards.requestConfirm', {
                            name: reward.name,
                            count: reward.costPoints,
                          }),
                        ) &&
                        mutation.mutate({
                          path: '/rewards/requests',
                          data: { rewardId: reward.id },
                        })
                      }
                    >
                      {balance.spendableBalance < reward.costPoints
                        ? t('rewards.notEnoughPoints')
                        : t('rewards.requestReward')}
                    </Button>
                    {isAdmin && (
                      <Button
                        size='sm'
                        variant='plain'
                        startDecorator={<Edit />}
                        onClick={() => setEditing(reward)}
                      >
                        {t('edit')}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Divider />
        <Typography level='h2'>{t('rewards.myRequests')}</Typography>
        {!mine.data?.res?.length ? (
          <EmptyState size='sm' title={t('rewards.noRequests')} />
        ) : (
          <Stack spacing={1}>
            {mine.data.res.map(request => (
              <Card variant='outlined' key={request.id}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent='space-between'
                  gap={1}
                >
                  <Box>
                    <Typography level='title-md'>
                      {request.rewardName}
                    </Typography>
                    <Typography level='body-sm'>
                      {t('rewards.requestedAt', {
                        count: request.costPoints,
                        date: date(request.requestedAt),
                      })}
                    </Typography>
                    {request.resolvedAt && (
                      <Typography level='body-xs'>
                        {t('rewards.resolvedAt', {
                          date: date(request.resolvedAt),
                        })}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction='row' alignItems='center' gap={1}>
                    <Chip color={statusColor[request.status]}>
                      {t(`rewards.status_${request.status}`)}
                    </Chip>
                    {request.status === 'pending' && (
                      <Button
                        size='sm'
                        variant='plain'
                        color='neutral'
                        onClick={() =>
                          act(
                            `/rewards/requests/${request.id}/cancel`,
                            t('rewards.cancelConfirm'),
                          )
                        }
                      >
                        {t('cancel')}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        {isAdmin && (
          <>
            <Divider />
            <Typography level='h2'>{t('rewards.pendingRequests')}</Typography>
            {!adminRequests.data?.res?.filter(r => r.status === 'pending')
              .length ? (
              <EmptyState size='sm' title={t('rewards.noPending')} />
            ) : (
              <Stack spacing={1}>
                {adminRequests.data.res
                  .filter(r => r.status === 'pending')
                  .map(request => (
                    <Card key={request.id} variant='outlined'>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent='space-between'
                        gap={2}
                      >
                        <Box>
                          <Typography level='title-md'>
                            {request.requesterName ||
                              t('rewards.memberFallback', {
                                id: request.userId,
                              })}
                          </Typography>
                          <Typography>
                            {request.rewardName} -{' '}
                            {t('rewards.points', {
                              count: request.costPoints,
                            })}
                          </Typography>
                          <Typography level='body-xs'>
                            {date(request.requestedAt)}
                          </Typography>
                        </Box>
                        <Stack direction='row' flexWrap='wrap' gap={1}>
                          <Button
                            color='success'
                            onClick={() =>
                              act(
                                `/rewards/requests/${request.id}/approve`,
                                t('rewards.approveConfirm', {
                                  name: request.rewardName,
                                  member: request.requesterName,
                                  count: request.costPoints,
                                }),
                              )
                            }
                          >
                            {t('rewards.approve')}
                          </Button>
                          <Button
                            color='danger'
                            variant='outlined'
                            onClick={() =>
                              act(
                                `/rewards/requests/${request.id}/reject`,
                                t('rewards.rejectConfirm'),
                              )
                            }
                          >
                            {t('rewards.reject')}
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
              </Stack>
            )}

            <Typography level='h2'>{t('rewards.manageRewards')}</Typography>
            <Stack spacing={1}>
              {rewards.data?.res?.map(reward => (
                <Card key={reward.id} variant='outlined'>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ sm: 'center' }}
                    justifyContent='space-between'
                    gap={1}
                  >
                    <Box>
                      <Typography level='title-md'>
                        {reward.name} -{' '}
                        {t('rewards.points', { count: reward.costPoints })}
                      </Typography>
                      <Chip
                        size='sm'
                        color={reward.isActive ? 'success' : 'neutral'}
                      >
                        {reward.isActive
                          ? t('rewards.active')
                          : t('rewards.archived')}
                      </Chip>
                    </Box>
                    <Stack direction='row' flexWrap='wrap' gap={0.5}>
                      <Button
                        size='sm'
                        variant='plain'
                        onClick={() => setEditing(reward)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        size='sm'
                        variant='plain'
                        color={reward.isActive ? 'warning' : 'success'}
                        startDecorator={<Inventory2 />}
                        onClick={() =>
                          mutation.mutate({
                            path: `/rewards/${reward.id}`,
                            method: 'put',
                            data: {
                              name: reward.name,
                              description: reward.description,
                              costPoints: reward.costPoints,
                              isActive: !reward.isActive,
                            },
                          })
                        }
                      >
                        {reward.isActive
                          ? t('rewards.archive')
                          : t('rewards.reactivate')}
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Stack>

      {(creating || editing) && (
        <RewardEditor
          reward={editing}
          mutation={mutation}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </Box>
  )
}
