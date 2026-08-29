import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'
import { activityCategory } from './activityViewModel'

const filterLabels = [
  { value: 'all', label: 'activity.filters.all' },
  { value: 'task', label: 'activity.filters.tasks' },
  { value: 'goal', label: 'activity.filters.goals' },
  { value: 'reward', label: 'activity.filters.rewards' },
  { value: 'streak', label: 'activity.filters.streaks' },
]

export default function FigmaActivityScreen({ events, isSolo, onOpenEvent }) {
  const { t } = useTranslation('common')
  const [filter, setFilter] = useState('all')
  const filtered =
    filter === 'all'
      ? events
      : events.filter(event => activityCategory(event.category) === filter)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('activity.title')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('activity.subtitle', {
              scope: t(isSolo ? 'activity.account' : 'activity.household'),
            })}
          </div>
        </div>
      </div>

      <div className='px-4 md:px-7'>
        <div className='mb-5 flex flex-wrap gap-2'>
          {filterLabels.map(item => (
            <button
              key={item.value}
              className={`btn btn-sm ${filter === item.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(item.value)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>

        <div className='flex flex-col gap-1'>
          {filtered.length === 0 && (
            <div className='empty-state'>
              <div style={{ fontSize: 48 }}>🗓</div>
              <div className='text-primary font-bold'>
                {t('activity.empty.title')}
              </div>
              <div className='text-muted' style={{ fontSize: 13 }}>
                {t('activity.empty.description')}
              </div>
            </div>
          )}

          {filtered.map((item, index) => {
            const isLast = index === filtered.length - 1
            return (
              <button
                key={item.id}
                className='flex items-start gap-4 px-1 py-4 text-start'
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: item.source ? 'pointer' : 'default',
                  fontFamily: 'var(--font-ui)',
                }}
                onClick={() => item.source && onOpenEvent(item.source)}
              >
                <div className='flex flex-shrink-0 flex-col items-center'>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                      border: `2px solid color-mix(in srgb, ${item.color} 25%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FigmaIcon
                      name={item.icon}
                      size={16}
                      style={{ color: item.color }}
                    />
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 24,
                        background: 'var(--line)',
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                <div className='min-w-0 flex-1 pb-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      {item.actor && (
                        <div
                          className='avatar'
                          style={{
                            width: 22,
                            height: 22,
                            background: item.actor.avatarColor,
                            fontSize: 9,
                          }}
                        >
                          {item.actor.initials}
                        </div>
                      )}
                      <span
                        className='text-primary font-semibold'
                        style={{ fontSize: 14 }}
                      >
                        {item.actor?.name || t('activity.system')}
                      </span>
                      <span className='text-muted' style={{ fontSize: 14 }}>
                        {t(`activity.actions.${item.action}`, {
                          name:
                            item.source?.choreName ||
                            t('activity.taskFallback'),
                        })}
                      </span>
                    </div>
                    <span
                      className='text-faint flex-shrink-0'
                      style={{ fontSize: 11 }}
                    >
                      {item.relativeTime}
                    </span>
                  </div>

                  {item.points != null && (
                    <div className='mt-1'>
                      <span
                        className='badge'
                        style={{
                          background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                          color: item.color,
                          fontSize: 11,
                        }}
                      >
                        {t('activity.points', { count: item.points })}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

FigmaActivityScreen.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      action: PropTypes.string.isRequired,
      actor: PropTypes.shape({
        avatarColor: PropTypes.string,
        initials: PropTypes.string,
        name: PropTypes.string,
      }),
      category: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      points: PropTypes.number,
      relativeTime: PropTypes.string.isRequired,
      source: PropTypes.object,
    }),
  ).isRequired,
  isSolo: PropTypes.bool.isRequired,
  onOpenEvent: PropTypes.func.isRequired,
}
