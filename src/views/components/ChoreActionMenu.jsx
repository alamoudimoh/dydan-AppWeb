import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AppModal from '../../components/common/AppModal'
import FigmaIcon from '../../components/FigmaIcon'
import LABEL_COLORS, {
  getTextColorFromBackgroundColor,
} from '../../utils/Colors'
import { isOfficialDydanInstanceSync } from '../../utils/FeatureToggle'
import { getIconComponent } from '../../utils/ProjectIcons'
import { useProjects } from '../Projects/ProjectQueries'

const useSmallViewport = () => {
  const [isSmall, setIsSmall] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 639px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setIsSmall(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isSmall
}

const menuIcon = (name, size = 18) => <FigmaIcon name={name} size={size} />

const skipIcon = (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M4 5v14l9-7z' />
    <path d='M20 5v14' />
  </svg>
)

const weekendIcon = (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M3 10h18' />
    <path d='M5 10l1 10h12l1-10' />
    <path d='M8 20v-6h8v6' />
    <path d='M12 3c-1.5-1.5-4.5-.5-5 2 1.5 1 1.5 2.5 1.5 3h7s0-1.5 1.5-3c-.5-2.5-3.5-3.5-5-2z' />
  </svg>
)

const backIcon = (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M19 12H5' />
    <path d='M12 19l-7-7 7-7' />
  </svg>
)

const ChoreActionMenu = ({
  chore,
  onAction,
  onChangeAssignee,
  onChangeDueDate,
  onCompleteWithNote,
  onCompleteWithPastDate,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  onNudge,
  onOpen,
  onWriteNFC,
  sx = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [isOfficialInstance, setIsOfficialInstance] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const menuRef = useRef(null)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const navigate = useNavigate()
  const { data: projects = [] } = useProjects()
  // Phone-only condition (matches AddTaskModal.jsx) — tablets/desktop keep the
  // absolutely-positioned menu.
  const isSmallScreen = useSmallViewport()
  const menuOpen = Boolean(anchorEl)

  useEffect(() => {
    try {
      setIsOfficialInstance(isOfficialDydanInstanceSync())
    } catch (error) {
      console.warn('Error checking instance type:', error)
      setIsOfficialInstance(false)
    }
  }, [])

  // Focus the first action when the desktop menu opens, and return focus to
  // the trigger when it closes.
  useEffect(() => {
    if (menuOpen && !isSmallScreen) {
      const first = menuRef.current?.querySelector('[role="menuitem"]')
      first?.focus()
    }
    if (!menuOpen && !isSmallScreen) {
      if (document.activeElement === containerRef.current) {
        triggerRef.current?.focus()
      }
    }
  }, [menuOpen, isSmallScreen])

  useEffect(() => {
    if (isSmallScreen) {
      // AppModal owns its own backdrop/escape close behavior on small screens.
      if (menuOpen && onOpen) {
        onOpen()
      }
      return
    }

    const handleMenuOutsideClick = event => {
      if (
        menuOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        handleMenuClose()
      }
    }

    document.addEventListener('mousedown', handleMenuOutsideClick)
    if (menuOpen && onOpen) {
      onOpen()
    }
    return () => {
      document.removeEventListener('mousedown', handleMenuOutsideClick)
    }
  }, [anchorEl, onOpen, isSmallScreen])

  const handleMenuKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleMenuClose()
      triggerRef.current?.focus()
    }
  }

  const handleMenuOpen = event => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setShowProjectPicker(false)
  }

  const handleMoveToProject = project => {
    onAction?.('moveToProject', chore, { project })
    handleMenuClose()
  }

  const handleEdit = () => {
    navigate(`/chores/${chore.id}/edit`)
    handleMenuClose()
  }

  const handleClone = () => {
    navigate(`/chores/${chore.id}/edit?clone=true`)
    handleMenuClose()
  }

  const handleView = () => {
    navigate(`/chores/${chore.id}`)
    handleMenuClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    } else {
      onAction?.('delete', chore)
    }
    handleMenuClose()
  }

  const handleArchive = () => {
    if (chore.isActive) {
      onAction?.('archive', chore)
    } else {
      onAction?.('unarchive', chore)
    }
    handleMenuClose()
  }

  const handleSkip = () => {
    onAction?.('skip', chore)
    handleMenuClose()
  }

  const handleHistory = () => {
    navigate(`/chores/${chore.id}/history`)
    handleMenuClose()
  }

  const getQuickScheduleDate = option => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (option) {
      case 'today': {
        const nowHour = now.getHours()
        const scheduled = new Date(today)
        if (nowHour < 9) {
          scheduled.setHours(9, 0, 0, 0)
        } else if (nowHour < 12) {
          scheduled.setHours(12, 0, 0, 0)
        } else if (nowHour < 17) {
          scheduled.setHours(17, 0, 0, 0)
        } else {
          scheduled.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds(),
          )
        }
        return scheduled
      }
      case 'tomorrow-morning': {
        const tomorrowMorning = new Date(today)
        tomorrowMorning.setDate(today.getDate() + 1)
        tomorrowMorning.setHours(9, 0, 0, 0)
        return tomorrowMorning
      }
      case 'tomorrow': {
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        tomorrow.setHours(12, 0, 0, 0)
        return tomorrow
      }
      case 'tomorrow-afternoon': {
        const tomorrowAfternoon = new Date(today)
        tomorrowAfternoon.setDate(today.getDate() + 1)
        tomorrowAfternoon.setHours(14, 0, 0, 0)
        return tomorrowAfternoon
      }
      case 'weekend': {
        const weekend = new Date(today)
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
        weekend.setDate(today.getDate() + daysUntilSaturday)
        return weekend
      }
      case 'next-week': {
        const nextWeek = new Date(today)
        const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7
        nextWeek.setDate(today.getDate() + daysUntilMonday)
        return nextWeek
      }
      default:
        return today
    }
  }

  const handleQuickSchedule = option => {
    const date = option === 'remove' ? null : getQuickScheduleDate(option)
    onAction?.('changeDueDate', chore, { date })
    handleMenuClose()
  }

  const renderProjectAvatar = (color, icon) => {
    const bg = color || LABEL_COLORS[0].value
    const IconComponent = getIconComponent(icon || 'FolderOpen')
    return (
      <span
        style={{
          alignItems: 'center',
          backgroundColor: bg,
          borderRadius: '50%',
          display: 'flex',
          flexShrink: 0,
          height: 22,
          justifyContent: 'center',
          width: 22,
        }}
      >
        <IconComponent
          sx={{ color: getTextColorFromBackgroundColor(bg), fontSize: 13 }}
        />
      </span>
    )
  }

  // Shared action list, rendered as menu buttons on large screens and as a
  // button stack inside an AppModal sheet on small screens.
  const actionItems = [
    {
      key: 'completeNote',
      icon: menuIcon('edit'),
      label: 'Complete with note',
      onClick: () => {
        onCompleteWithNote?.()
        handleMenuClose()
      },
    },
    {
      key: 'completePast',
      icon: menuIcon('repeat'),
      label: 'Complete in past',
      onClick: () => {
        onCompleteWithPastDate?.()
        handleMenuClose()
      },
    },
    {
      key: 'skip',
      icon: skipIcon,
      label: 'Skip to next due date',
      onClick: handleSkip,
    },
    {
      key: 'delegate',
      icon: menuIcon('users'),
      label: 'Delegate to someone else',
      onClick: () => {
        onChangeAssignee?.()
        handleMenuClose()
      },
    },
    isOfficialInstance && {
      key: 'nudge',
      icon: menuIcon('bell'),
      label: 'Send nudge',
      onClick: () => {
        onNudge?.()
        handleMenuClose()
      },
    },
    { key: 'divider-1', type: 'divider' },
    {
      key: 'history',
      icon: menuIcon('search'),
      label: 'History',
      onClick: handleHistory,
    },
    { key: 'divider-2', type: 'divider' },
    { key: 'quickSchedule', type: 'quickSchedule' },
    { key: 'divider-3', type: 'divider' },
    {
      key: 'changeDueDate',
      icon: menuIcon('calendar'),
      label: 'Change due date',
      onClick: () => {
        onChangeDueDate?.()
        handleMenuClose()
      },
    },
    {
      key: 'writeNfc',
      icon: menuIcon('tag'),
      label: 'Write to NFC',
      onClick: () => {
        onWriteNFC?.()
        handleMenuClose()
      },
    },
    { key: 'edit', icon: menuIcon('edit'), label: 'Edit', onClick: handleEdit },
    {
      key: 'clone',
      icon: menuIcon('copy'),
      label: 'Clone',
      onClick: handleClone,
    },
    {
      key: 'view',
      icon: menuIcon('eye'),
      label: 'View',
      onClick: handleView,
    },
    {
      key: 'archive',
      icon: menuIcon('archive'),
      label: chore.isActive ? 'Archive' : 'Unarchive',
      onClick: handleArchive,
      color: 'neutral',
    },
    projects.length > 0 && {
      key: 'moveToProject',
      icon: menuIcon('projects'),
      label: 'Move to project',
      onClick: () => setShowProjectPicker(true),
    },
    { key: 'divider-4', type: 'divider' },
    {
      key: 'delete',
      icon: menuIcon('trash'),
      label: 'Delete',
      onClick: handleDelete,
      color: 'danger',
    },
  ].filter(Boolean)

  const quickScheduleButton = (title, icon, option) => (
    <button
      className='btn btn-ghost btn-sm'
      title={title}
      aria-label={title}
      type='button'
      onClick={event => {
        event.stopPropagation()
        handleQuickSchedule(option)
      }}
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: 34,
        minWidth: 34,
        padding: 0,
      }}
    >
      {icon}
    </button>
  )

  const quickScheduleButtons = (
    <>
      {quickScheduleButton('Today', menuIcon('today', 16), 'today')}
      {quickScheduleButton('Tomorrow', menuIcon('calendar', 16), 'tomorrow')}
      {quickScheduleButton('Weekend', weekendIcon, 'weekend')}
      {quickScheduleButton('Next week', menuIcon('repeat', 16), 'next-week')}
      {quickScheduleButton(
        'Remove due date',
        <FigmaIcon name='x' size={16} />,
        'remove',
      )}
    </>
  )

  const quickScheduleRowSx = {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-around',
    padding: '8px 12px',
  }

  const renderMenuActionItems = () =>
    actionItems.map(item => {
      if (item.type === 'divider') {
        return <hr key={item.key} className='border-line' />
      }
      if (item.type === 'quickSchedule') {
        return (
          <div
            key={item.key}
            role='none'
            style={{
              ...quickScheduleRowSx,
              cursor: 'default',
            }}
            onClick={event => event.stopPropagation()}
          >
            {quickScheduleButtons}
          </div>
        )
      }
      return (
        <button
          key={item.key}
          type='button'
          role='menuitem'
          className='btn btn-ghost'
          style={{
            alignItems: 'center',
            border: 0,
            borderRadius: 'var(--r-sm)',
            color:
              item.color === 'danger' ? 'var(--sig-over)' : 'var(--t-primary)',
            cursor: 'pointer',
            display: 'flex',
            font: '500 14px var(--font-ui)',
            gap: 10,
            justifyContent: 'flex-start',
            padding: '8px 12px',
            textAlign: 'start',
            width: '100%',
          }}
          onClick={event => {
            event.stopPropagation()
            item.onClick()
          }}
        >
          <span
            style={{
              alignItems: 'center',
              color: item.color ? 'currentColor' : 'var(--t-muted)',
              display: 'flex',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      )
    })

  const renderModalActionItems = () =>
    actionItems.map(item => {
      if (item.type === 'divider')
        return <hr key={item.key} className='border-line' />
      if (item.type === 'quickSchedule') {
        return (
          <div key={item.key} style={quickScheduleRowSx}>
            {quickScheduleButtons}
          </div>
        )
      }
      return (
        <button
          key={item.key}
          className='btn btn-ghost'
          style={{
            alignItems: 'center',
            border: 0,
            borderRadius: 'var(--r-sm)',
            color:
              item.color === 'danger' ? 'var(--sig-over)' : 'var(--t-primary)',
            cursor: 'pointer',
            display: 'flex',
            font: '500 14px var(--font-ui)',
            gap: 10,
            justifyContent: 'flex-start',
            padding: '10px 12px',
            textAlign: 'start',
            width: '100%',
          }}
          onClick={() => item.onClick()}
        >
          <span
            style={{
              alignItems: 'center',
              color: item.color ? 'currentColor' : 'var(--t-muted)',
              display: 'flex',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      )
    })

  const renderModalProjectPicker = () => (
    <>
      <button
        type='button'
        className='btn btn-ghost'
        style={{
          alignItems: 'center',
          border: 0,
          borderRadius: 'var(--r-sm)',
          color: 'var(--t-primary)',
          cursor: 'pointer',
          display: 'flex',
          font: '500 14px var(--font-ui)',
          gap: 10,
          justifyContent: 'flex-start',
          padding: '10px 12px',
          textAlign: 'start',
          width: '100%',
        }}
        onClick={() =>
          handleMoveToProject({ id: null, name: 'Default Project' })
        }
      >
        {renderProjectAvatar(LABEL_COLORS[0].value, 'FolderOpen')}
        <span>Default Project</span>
      </button>
      {projects.map(project => (
        <button
          key={project.id}
          type='button'
          className='btn btn-ghost'
          style={{
            alignItems: 'center',
            border: 0,
            borderRadius: 'var(--r-sm)',
            color: 'var(--t-primary)',
            cursor: 'pointer',
            display: 'flex',
            font: '500 14px var(--font-ui)',
            gap: 10,
            justifyContent: 'flex-start',
            padding: '10px 12px',
            textAlign: 'start',
            width: '100%',
          }}
          onClick={() => handleMoveToProject(project)}
        >
          {renderProjectAvatar(project.color, project.icon)}
          <span>{project.name}</span>
        </button>
      ))}
    </>
  )

  const renderProjectPickerItems = () => (
    <>
      <button
        type='button'
        role='menuitem'
        className='btn btn-ghost'
        style={{
          alignItems: 'center',
          border: 0,
          borderRadius: 'var(--r-sm)',
          color: 'var(--t-primary)',
          cursor: 'pointer',
          display: 'flex',
          font: '600 14px var(--font-ui)',
          gap: 10,
          justifyContent: 'flex-start',
          padding: '8px 12px',
          textAlign: 'start',
          width: '100%',
        }}
        onClick={event => {
          event.stopPropagation()
          handleMoveToProject({ id: null, name: 'Default Project' })
        }}
      >
        {renderProjectAvatar(LABEL_COLORS[0].value, 'FolderOpen')}
        <span>Default Project</span>
      </button>
      {projects.map(project => (
        <button
          key={project.id}
          type='button'
          role='menuitem'
          className='btn btn-ghost'
          style={{
            alignItems: 'center',
            border: 0,
            borderRadius: 'var(--r-sm)',
            color: 'var(--t-primary)',
            cursor: 'pointer',
            display: 'flex',
            font: '500 14px var(--font-ui)',
            gap: 10,
            justifyContent: 'flex-start',
            padding: '8px 12px',
            textAlign: 'start',
            width: '100%',
          }}
          onClick={event => {
            event.stopPropagation()
            handleMoveToProject(project)
          }}
        >
          {renderProjectAvatar(project.color, project.icon)}
          <span>{project.name}</span>
        </button>
      ))}
    </>
  )

  const menuStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-md)',
    boxShadow: 'var(--shadow-lg)',
    insetInlineEnd: 0,
    marginTop: 6,
    minWidth: 220,
    padding: 6,
    position: 'absolute',
    top: '100%',
    zIndex: 1000,
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'inline-flex', position: 'relative' }}
    >
      <button
        ref={triggerRef}
        type='button'
        aria-haspopup='menu'
        aria-expanded={menuOpen}
        aria-label='Chore actions'
        onClick={handleMenuOpen}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className='btn btn-ghost btn-icon'
        style={{
          alignItems: 'center',
          borderRadius: '50%',
          display: 'flex',
          height: 25,
          justifyContent: 'center',
          left: -10,
          minHeight: 25,
          minWidth: 25,
          padding: 0,
          position: 'relative',
          width: 25,
          ...sx,
        }}
      >
        <FigmaIcon name='bars' />
      </button>

      {isSmallScreen ? (
        <AppModal
          open={menuOpen}
          onClose={handleMenuClose}
          title={showProjectPicker ? 'Move to project' : chore?.name}
          mobilePresentation='sheet'
          showHandle
          contentSx={{ px: 0, pb: 1 }}
        >
          {showProjectPicker && (
            <button
              type='button'
              className='btn btn-ghost'
              style={{
                alignItems: 'center',
                border: 0,
                borderRadius: 'var(--r-sm)',
                color: 'var(--t-primary)',
                cursor: 'pointer',
                display: 'flex',
                font: '600 14px var(--font-ui)',
                gap: 8,
                justifyContent: 'flex-start',
                margin: '4px 16px 8px',
                padding: '8px 12px',
                textAlign: 'start',
              }}
              onClick={() => setShowProjectPicker(false)}
            >
              {backIcon}
              <span>Back</span>
            </button>
          )}
          <div style={{ padding: '0 8px' }}>
            {showProjectPicker
              ? renderModalProjectPicker()
              : renderModalActionItems()}
          </div>
        </AppModal>
      ) : (
        menuOpen && (
          <div
            ref={menuRef}
            role='menu'
            aria-label={showProjectPicker ? 'Move to project' : 'Chore actions'}
            style={menuStyle}
            onKeyDown={handleMenuKeyDown}
          >
            {showProjectPicker ? (
              <>
                <button
                  type='button'
                  role='none'
                  className='btn btn-ghost'
                  style={{
                    alignItems: 'center',
                    border: 0,
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--t-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    font: '600 14px var(--font-ui)',
                    gap: 8,
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    textAlign: 'start',
                    width: '100%',
                  }}
                  onClick={event => {
                    event.stopPropagation()
                    setShowProjectPicker(false)
                  }}
                >
                  {backIcon}
                  <span>Move to project</span>
                </button>
                <hr className='border-line' />
                {renderProjectPickerItems()}
              </>
            ) : (
              renderMenuActionItems()
            )}
          </div>
        )
      )}
    </div>
  )
}

export default ChoreActionMenu
