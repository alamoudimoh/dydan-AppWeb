import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'

const statusColor = status => {
  if (status === 'overdue') return 'var(--sig-over)'
  if (status === 'due-soon') return 'var(--sig-due)'
  return 'var(--sig-done)'
}

const statusBg = status => {
  if (status === 'overdue') return 'var(--sig-over-bg)'
  if (status === 'due-soon') return 'var(--sig-due-bg)'
  return 'var(--sig-done-bg)'
}

const statusLabelKey = status => {
  if (status === 'overdue') return 'maintenance.statusOverdue'
  if (status === 'due-soon') return 'maintenance.statusDueSoon'
  return 'maintenance.statusOk'
}

export default function FigmaMaintenanceScreen({
  items,
  onAddItem,
  onMarkDone,
  onSchedule,
  subtitle,
  title,
}) {
  const { t } = useTranslation('common')
  const attentionCount = items.filter(item => item.status !== 'ok').length

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {title}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {subtitle}
          </div>
        </div>
        <button className='btn btn-primary' onClick={onAddItem}>
          <FigmaIcon name='plus' size={14} />
          {t('maintenance.addItem')}
        </button>
      </div>

      <div className='px-4 md:px-7'>
        {attentionCount > 0 && (
          <div
            className='mb-5 rounded-lg p-4'
            style={{
              background: 'var(--sig-due-bg)',
              border: '1px solid var(--sig-due)',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <div className='mb-1 flex items-center gap-2'>
              <FigmaIcon
                name='error'
                size={15}
                style={{ color: 'var(--sig-due)' }}
              />
              <span
                className='font-bold'
                style={{ fontSize: 13, color: 'var(--sig-due)' }}
              >
                {t('maintenance.itemsNeedAttention', {
                  count: attentionCount,
                })}
              </span>
            </div>
            <div className='text-muted' style={{ fontSize: 12 }}>
              {t('maintenance.attentionDescription')}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className='empty-state'>
            <div style={{ fontSize: 44 }}>🔧</div>
            <div className='text-primary font-bold'>
              {t('maintenance.noSchedules')}
            </div>
            <div className='text-muted' style={{ fontSize: 13 }}>
              {t('maintenance.noSchedulesDescription')}
            </div>
            <button className='btn btn-primary mt-3' onClick={onAddItem}>
              <FigmaIcon name='plus' size={14} />
              {t('maintenance.addItem')}
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {items.map(item => (
              <div key={item.id} className='card p-5'>
                <div className='flex items-start gap-4'>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--r-lg)',
                      background: `color-mix(in srgb, ${statusColor(item.status)} 10%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div
                        className='text-primary font-bold'
                        style={{ fontSize: 15 }}
                      >
                        {item.name}
                      </div>
                      <span
                        className='badge'
                        style={{
                          background: statusBg(item.status),
                          color: statusColor(item.status),
                          fontSize: 11,
                        }}
                      >
                        {t(statusLabelKey(item.status))}
                      </span>
                    </div>
                    {item.description && (
                      <div
                        className='text-muted mb-2'
                        style={{ fontSize: 12, marginTop: 2 }}
                      >
                        {item.description}
                      </div>
                    )}
                    {(item.nextDue || item.lastDone || item.intervalDays) && (
                      <div className='mt-2 flex flex-wrap gap-4'>
                        {item.nextDue && (
                          <div>
                            <div className='metric-label'>
                              {t('maintenance.nextDueLabel')}
                            </div>
                            <div
                              className='font-semibold'
                              style={{
                                fontSize: 13,
                                color: statusColor(item.status),
                              }}
                            >
                              {item.nextDue}
                            </div>
                          </div>
                        )}
                        {item.lastDone && (
                          <div>
                            <div className='metric-label'>
                              {t('maintenance.lastDoneLabel')}
                            </div>
                            <div
                              className='text-muted'
                              style={{ fontSize: 13 }}
                            >
                              {item.lastDone}
                            </div>
                          </div>
                        )}
                        {item.intervalDays && (
                          <div>
                            <div className='metric-label'>
                              {t('maintenance.intervalLabel')}
                            </div>
                            <div
                              className='text-muted'
                              style={{ fontSize: 13 }}
                            >
                              {t('maintenance.everyDays', {
                                count: item.intervalDays,
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col gap-1'>
                    {item.choreId && (
                      <button
                        className='btn btn-sm btn-secondary'
                        onClick={() => onMarkDone(item)}
                      >
                        {t('maintenance.markDone')}
                      </button>
                    )}
                    <button
                      className='btn btn-sm btn-ghost'
                      onClick={() => onSchedule(item)}
                    >
                      {t('maintenance.scheduleAction')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

FigmaMaintenanceScreen.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      assetId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      choreId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      description: PropTypes.string,
      icon: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      intervalDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      lastDone: PropTypes.string,
      name: PropTypes.string,
      nextDue: PropTypes.string,
      status: PropTypes.oneOf(['overdue', 'due-soon', 'ok']).isRequired,
    }),
  ).isRequired,
  onAddItem: PropTypes.func.isRequired,
  onMarkDone: PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}
