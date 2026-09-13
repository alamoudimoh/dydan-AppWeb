import '../../styles/screenExperience.css'

import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'
import {
  routineAssignees,
  routineScheduleLabel,
  routineSteps,
} from './routineViewModel'

export default function FigmaRoutinesScreen({
  canArchive,
  canCreate,
  members,
  onEditRoutine,
  onNewRoutine,
  onSetActive,
  onUseRoutine,
  packs,
}) {
  const { t } = useTranslation('chores')
  const [expanded, setExpanded] = useState(undefined)
  const expandedId = expanded === undefined ? packs[0]?.id : expanded

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='screen-page-header page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('routines.title')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('routines.subtitle')}
          </div>
        </div>
        {canCreate && (
          <button
            className='screen-page-action btn btn-primary'
            onClick={onNewRoutine}
            type='button'
          >
            <FigmaIcon name='plus' size={14} />
            {t('routines.newRoutine')}
          </button>
        )}
      </div>

      <div className='flex flex-col gap-3 px-4 md:px-7'>
        {packs.map(pack => {
          const steps = routineSteps(pack)
          const isExpanded = expandedId === pack.id
          const assignees = routineAssignees(pack, members)
          const assignee = assignees[0]
          const schedule =
            routineScheduleLabel(pack, t) ||
            t('routines.countTasks', { count: pack.items?.length || 0 })

          return (
            <div key={pack.id} className='card overflow-hidden'>
              <button
                aria-controls={`routine-${pack.id}-details`}
                aria-expanded={isExpanded}
                className='screen-routine-trigger flex w-full items-center gap-4 px-5 py-4'
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'start',
                  fontFamily: 'var(--font-ui)',
                }}
                onClick={() => setExpanded(isExpanded ? null : pack.id)}
                type='button'
              >
                <span style={{ fontSize: 28, lineHeight: 1, display: 'flex' }}>
                  <FigmaIcon
                    name='routines'
                    size={26}
                    style={{ color: 'var(--sig-due)' }}
                  />
                </span>
                <div className='min-w-0 flex-1'>
                  <div
                    className='screen-routine-copy text-primary font-bold'
                    style={{ fontSize: 15 }}
                  >
                    {pack.name}
                  </div>
                  <div className='mt-1 flex flex-wrap items-center gap-3'>
                    <span className='text-muted' style={{ fontSize: 12 }}>
                      {schedule}
                    </span>
                    {assignee && (
                      <div className='flex items-center gap-1'>
                        <div
                          className='avatar'
                          style={{
                            width: 16,
                            height: 16,
                            background: assignee.avatarColor || 'var(--brand)',
                            fontSize: 7,
                          }}
                        >
                          {assignee.initials ||
                            assignee.displayName?.slice(0, 2)?.toUpperCase()}
                        </div>
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          {assignee.displayName || assignee.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className='screen-routine-status flex items-center gap-2'>
                  {pack.isActive ? (
                    <span
                      className='badge bg-sig-done-bg text-sig-done'
                      style={{ fontSize: 10 }}
                    >
                      {t('routines.active')}
                    </span>
                  ) : (
                    <span
                      className='badge bg-sig-over-bg text-sig-over'
                      style={{ fontSize: 10 }}
                    >
                      {t('routines.archived')}
                    </span>
                  )}
                  <FigmaIcon
                    name='chevron_down'
                    size={16}
                    style={{
                      color: 'var(--t-faint)',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div
                  className='border-line border-t px-5 py-4'
                  id={`routine-${pack.id}-details`}
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className='section-label mb-3' style={{ padding: 0 }}>
                    {t('routines.stepsInRoutine')}
                  </div>
                  <div className='flex flex-col gap-2'>
                    {steps.length === 0 && (
                      <div className='text-muted py-2' style={{ fontSize: 13 }}>
                        {t('routines.countTasks', { count: 0 })}
                      </div>
                    )}
                    {steps.map((title, index) => (
                      <div
                        key={`${pack.id}-${index}`}
                        className='flex items-center gap-3 rounded-lg p-2'
                        style={{
                          background: 'var(--surface-2)',
                          borderRadius: 'var(--r-md)',
                        }}
                      >
                        <div
                          className='flex items-center justify-center'
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--line)',
                            color: 'var(--t-muted)',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className='text-primary' style={{ fontSize: 13 }}>
                          {title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='screen-routine-actions mt-4'>
                    {canCreate && (
                      <button
                        className='btn btn-sm btn-secondary'
                        onClick={() => onEditRoutine(pack)}
                        type='button'
                      >
                        {t('routines.editRoutine')}
                      </button>
                    )}
                    {pack.isActive && (
                      <button
                        className='btn btn-sm btn-secondary'
                        onClick={() => onUseRoutine(pack)}
                        disabled={!steps.length}
                        type='button'
                      >
                        {t('routines.useRoutine')}
                      </button>
                    )}
                    {canArchive && (
                      <button
                        className='btn btn-sm btn-ghost text-sig-over'
                        onClick={() => onSetActive(pack)}
                        type='button'
                      >
                        {pack.isActive
                          ? t('routines.archive')
                          : t('routines.reactivate')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {packs.length === 0 && (
          <div className='empty-state'>
            <div style={{ fontSize: 48 }}>🔄</div>
            <div className='text-primary font-bold' style={{ fontSize: 16 }}>
              {t('routines.noRoutines')}
            </div>
            <div className='text-muted' style={{ fontSize: 13 }}>
              {t('routines.noRoutinesHint')}
            </div>
            {canCreate && (
              <button
                className='btn btn-primary mt-2'
                onClick={onNewRoutine}
                type='button'
              >
                <FigmaIcon name='plus' size={15} />
                {t('routines.createRoutine')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

FigmaRoutinesScreen.propTypes = {
  canArchive: PropTypes.bool.isRequired,
  canCreate: PropTypes.bool.isRequired,
  members: PropTypes.array,
  onEditRoutine: PropTypes.func.isRequired,
  onNewRoutine: PropTypes.func.isRequired,
  onSetActive: PropTypes.func.isRequired,
  onUseRoutine: PropTypes.func.isRequired,
  packs: PropTypes.array.isRequired,
}

FigmaRoutinesScreen.defaultProps = {
  members: [],
}
