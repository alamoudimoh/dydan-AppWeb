import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import Tabs from '@mui/joy/Tabs'
import type { ReactNode } from 'react'

import { MODULE_BY_ID, type Screen } from '../navigation/moduleRegistry'

export function PageLayout({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`page-container ${className}`.trim()}>{children}</div>
}

export function PageBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`page-body px-4 md:px-7 ${className}`.trim()}>
      {children}
    </div>
  )
}

export function PageHeader({
  actions,
  className = '',
  description,
  eyebrow,
  title,
}: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className='page-header-copy'>
        {eyebrow ? <div className='page-eyebrow'>{eyebrow}</div> : null}
        <h1 className='text-primary'>{title}</h1>
        {description ? (
          <div className='text-muted page-description'>{description}</div>
        ) : null}
      </div>
      {actions ? <div className='page-actions'>{actions}</div> : null}
    </header>
  )
}

export function ModulePageHeader({
  actions,
  className = '',
  description,
  eyebrow,
  module,
}: {
  module: Screen
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <PageHeader
      title={MODULE_BY_ID[module].title}
      description={description}
      eyebrow={eyebrow}
      actions={actions}
      className={className}
    />
  )
}

export function SectionHeader({
  actions,
  description,
  title,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className='global-section-header'>
      <div>
        <h2>{title}</h2>
        {description ? <div className='text-muted'>{description}</div> : null}
      </div>
      {actions ? <div className='section-actions'>{actions}</div> : null}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  className = '',
  label,
  onChange,
  options,
  value,
}: {
  label: string
  value: T
  options: readonly { id: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={`seg-tabs ${className}`.trim()}
      role='group'
      aria-label={label}
    >
      {options.map(option => (
        <button
          key={option.id}
          type='button'
          className={`seg-tab ${value === option.id ? 'active' : ''}`}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function GlobalTabs({
  children,
  onChange,
  options,
  value,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { id: string; label: ReactNode; icon?: ReactNode }[]
  children: ReactNode
}) {
  return (
    <Tabs
      value={value}
      onChange={(_, next) => next && onChange(String(next))}
      sx={{ bgcolor: 'transparent' }}
    >
      <div className='global-tabs-sticky px-4 md:px-7 sticky top-0 z-30'>
        <TabList
          disableUnderline
          sx={{
            gap: 0.5,
            rowGap: 0.5,
            overflowX: { xs: 'auto', lg: 'visible' },
            flexWrap: { xs: 'nowrap', lg: 'wrap' },
            scrollbarWidth: 'none',
            borderBottom: '1px solid var(--line)',
            pb: '6px',
            '&::-webkit-scrollbar': { display: 'none' },
            '& .MuiTab-root': {
              flex: 'none',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--r-md)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--t-muted)',
              minHeight: 34,
              px: 1.5,
            },
            '& .MuiTab-root:hover': {
              bgcolor: 'var(--surface-2)',
              color: 'var(--t-primary)',
            },
            "& .MuiTab-root[aria-selected='true']": {
              bgcolor: 'var(--selected-bg)',
              color: 'var(--selected-text)',
            },
          }}
        >
          {options.map(option => (
            <Tab key={option.id} value={option.id} disableIndicator>
              {option.icon}
              <span className={option.icon ? 'ms-1.5' : ''}>
                {option.label}
              </span>
            </Tab>
          ))}
        </TabList>
      </div>
      {children}
    </Tabs>
  )
}

export function Breadcrumbs({
  items,
}: {
  items: readonly { label: ReactNode; current?: boolean }[]
}) {
  return (
    <nav className='global-breadcrumbs' aria-label='Breadcrumb'>
      <ol>
        {items.map((item, index) => (
          <li key={index} aria-current={item.current ? 'page' : undefined}>
            {item.label}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function EmptyState({
  action,
  className = '',
  description,
  icon,
  title,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      {icon ? <div className='empty-state-icon'>{icon}</div> : null}
      <div className='font-bold text-primary empty-state-title'>{title}</div>
      {description ? (
        <div className='text-muted empty-state-description'>{description}</div>
      ) : null}
      {action}
    </div>
  )
}
