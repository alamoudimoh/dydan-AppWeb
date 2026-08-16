import { Add, CardGiftcard, Edit, Inventory2 } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Modal,
  ModalDialog,
  Stack,
  Textarea,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'

import {
  useAdminRewardRequests,
  useMyRewardRequests,
  useRewardMutation,
  useRewards,
} from '../../queries/RewardQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import { inlineErrorAlertSx, listPageContainerSx, pageStackSpacing } from '../../theme/appLayout'

const statusColor = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
}
const date = value => (value ? new Date(value).toLocaleString() : '—')

function RewardEditor({ mutation, onClose, reward }) {
  const [name, setName] = useState(reward?.name || '')
  const [description, setDescription] = useState(reward?.description || '')
  const [cost, setCost] = useState(reward?.costPoints || '')
  const valid =
    name.trim() && Number.isInteger(Number(cost)) && Number(cost) > 0
  const save = async () => {
    await mutation.mutateAsync({
      path: reward ? `/rewards/${reward.id}` : '/rewards',
      method: reward ? 'put' : 'post',
      data: {
        name: name.trim(),
        description: description.trim(),
        costPoints: Number(cost),
        ...(reward && { isActive: reward.isActive }),
      },
    })
    onClose()
  }
  return (
    <Modal open onClose={onClose}>
      <ModalDialog>
        <DialogTitle>{reward ? 'Edit reward' : 'Create reward'}</DialogTitle>
        <DialogContent>Set a clear reward and its point cost.</DialogContent>
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>Name</FormLabel>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              minRows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </FormControl>
          <FormControl required>
            <FormLabel>Point cost</FormLabel>
            <Input
              type='number'
              slotProps={{ input: { min: 1, step: 1 } }}
              value={cost}
              onChange={e => setCost(e.target.value)}
            />
          </FormControl>
        </Stack>
        <DialogActions>
          <Button onClick={save} disabled={!valid || mutation.isPending}>
            Save
          </Button>
          <Button variant='plain' color='neutral' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  )
}

export default function RewardsView() {
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
  const act = async (path, message) => {
    if (window.confirm(message)) await mutation.mutateAsync({ path, data: {} })
  }
  if (rewards.isLoading || mine.isLoading) {
    return <QueryLoadingView />
  }
  return (
    <Container maxWidth='lg' sx={listPageContainerSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title='Rewards'
          subtitle='Turn earned points into something worth looking forward to.'
        />
        {mutation.error && (
          <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
            {mutation.error.message}
          </Alert>
        )}
        <Grid container spacing={2}>
          {[
            ['Available', balance.currentBalance],
            ['Reserved', balance.pendingReserved],
            ['Spendable', balance.spendableBalance],
          ].map(([label, value]) => (
            <Grid xs={12} sm={4} key={label}>
              <Card variant='soft'>
                <CardContent>
                  <Typography level='body-sm'>{label}</Typography>
                  <Typography level='h2' className='daydan-metric'>
                    {value} points
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography level='h2'>Available rewards</Typography>
          {isAdmin && (
            <Button startDecorator={<Add />} onClick={() => setCreating(true)}>
              Create reward
            </Button>
          )}
        </Stack>
        {!active.length ? (
          <Card variant='outlined'>
            <CardContent>
              <Typography>No rewards yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {active.map(reward => (
              <Grid xs={12} sm={6} md={4} key={reward.id}>
                <Card sx={{ height: '100%' }}>
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
                        {reward.costPoints} points
                      </Typography>
                      <Button
                        disabled={
                          mutation.isPending ||
                          balance.spendableBalance < reward.costPoints
                        }
                        onClick={() =>
                          window.confirm(
                            `Request “${reward.name}” for ${reward.costPoints} points? This request will wait for admin approval.`,
                          ) &&
                          mutation.mutate({
                            path: '/rewards/requests',
                            data: { rewardId: reward.id },
                          })
                        }
                      >
                        {balance.spendableBalance < reward.costPoints
                          ? 'Not enough points'
                          : 'Request reward'}
                      </Button>
                      {isAdmin && (
                        <Button
                          size='sm'
                          variant='plain'
                          startDecorator={<Edit />}
                          onClick={() => setEditing(reward)}
                        >
                          Edit
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Divider />
        <Typography level='h2'>My requests</Typography>
        {!mine.data?.res?.length ? (
          <Typography color='neutral'>
            You haven’t requested any rewards yet.
          </Typography>
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
                      {request.costPoints} points · Requested{' '}
                      {date(request.requestedAt)}
                    </Typography>
                    {request.resolvedAt && (
                      <Typography level='body-xs'>
                        Resolved {date(request.resolvedAt)}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction='row' alignItems='center' gap={1}>
                    <Chip color={statusColor[request.status]}>
                      {request.status[0].toUpperCase() +
                        request.status.slice(1)}
                    </Chip>
                    {request.status === 'pending' && (
                      <Button
                        size='sm'
                        variant='plain'
                        color='neutral'
                        onClick={() =>
                          act(
                            `/rewards/requests/${request.id}/cancel`,
                            'Cancel this pending reward request?',
                          )
                        }
                      >
                        Cancel
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
            <Typography level='h2'>Pending reward requests</Typography>
            {!adminRequests.data?.res?.filter(r => r.status === 'pending')
              .length ? (
              <Typography color='neutral'>No pending requests.</Typography>
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
                              `Member ${request.userId}`}
                          </Typography>
                          <Typography>
                            {request.rewardName} · {request.costPoints} points
                          </Typography>
                          <Typography level='body-xs'>
                            {date(request.requestedAt)}
                          </Typography>
                        </Box>
                        <Stack direction='row'>
                          <Button
                            color='success'
                            onClick={() =>
                              act(
                                `/rewards/requests/${request.id}/approve`,
                                `Approve ${request.rewardName} for ${request.requesterName} for ${request.costPoints} points?`,
                              )
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            color='danger'
                            variant='outlined'
                            onClick={() =>
                              act(
                                `/rewards/requests/${request.id}/reject`,
                                `Reject this reward request?`,
                              )
                            }
                          >
                            Reject
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
              </Stack>
            )}
            <Typography level='h2'>Manage rewards</Typography>
            <Stack spacing={1}>
              {rewards.data?.res?.map(reward => (
                <Card key={reward.id} variant='outlined'>
                  <Stack
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                  >
                    <Box>
                      <Typography level='title-md'>
                        {reward.name} · {reward.costPoints} points
                      </Typography>
                      <Chip
                        size='sm'
                        color={reward.isActive ? 'success' : 'neutral'}
                      >
                        {reward.isActive ? 'Active' : 'Archived'}
                      </Chip>
                    </Box>
                    <Stack direction='row'>
                      <Button
                        size='sm'
                        variant='plain'
                        onClick={() => setEditing(reward)}
                      >
                        Edit
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
                        {reward.isActive ? 'Archive' : 'Reactivate'}
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
    </Container>
  )
}
