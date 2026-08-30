import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppModal from '../../components/common/AppModal'

export function RewardEditor({ mutation, onClose, reward }) {
  const { t } = useTranslation('common')
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
    <AppModal
      open
      onClose={onClose}
      title={reward ? t('rewards.editReward') : t('rewards.createReward')}
      description={t('rewards.rewardDescription')}
      footer={
        <form
          onSubmit={event => {
            event.preventDefault()
            void save()
          }}
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}
        >
          <button type='button' className='btn btn-ghost' onClick={onClose}>
            {t('cancel')}
          </button>
          <button
            type='submit'
            className='btn btn-primary'
            disabled={!valid || mutation.isPending}
          >
            {t('rewards.saveReward')}
          </button>
        </form>
      }
    >
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <label htmlFor='reward-name' className='text-sm'>
            {t('rewards.name')}
          </label>
          <input
            id='reward-name'
            className='input'
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor='reward-description' className='text-sm'>
            {t('rewards.description')}
          </label>
          <textarea
            id='reward-description'
            className='input'
            rows={2}
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor='reward-cost' className='text-sm'>
            {t('rewards.pointCost')}
          </label>
          <input
            id='reward-cost'
            className='input'
            type='number'
            min='1'
            step='1'
            value={cost}
            onChange={event => setCost(event.target.value)}
          />
        </div>
      </div>
    </AppModal>
  )
}

export default RewardEditor
