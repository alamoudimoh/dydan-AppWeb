import '../i18n'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '../App'

type FormModalProps = {
  /** Localized modal title. */
  title: string
  /** Entity icon from the shared dydan icon system. */
  icon: string
  onClose: () => void
  onSubmit: () => void
  children: ReactNode
  /** Localized primary action label. */
  submitLabel: string
  /** Localized label shown while the server write is pending. */
  loadingLabel: string
  submitting?: boolean
  submitDisabled?: boolean
  error?: string | null
}

/**
 * Canonical creation-modal shell (Fix 03).
 *
 * This component is the single owner of every Create experience's outer
 * frame: overlay, width, height constraints, positioning, radius, header,
 * icon/title/close placement, body scrolling, field spacing, validation,
 * footer, actions, Escape/overlay dismissal, responsive behavior, and RTL.
 * Entity configurations provide body content only; screens never redefine
 * this modal's geometry or layout.
 */
export default function FormModal({
  children,
  error,
  icon,
  loadingLabel,
  onClose,
  onSubmit,
  submitDisabled = false,
  submitLabel,
  submitting = false,
  title,
}: FormModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null
    return () => prior?.focus()
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!submitting && !submitDisabled) onSubmit()
  }

  return (
    <div
      className='modal-overlay create-modal-overlay'
      data-testid='create-modal-overlay'
      onMouseDown={event => {
        if (event.target === event.currentTarget && !submitting) onClose()
      }}
    >
      <div
        ref={panelRef}
        className='modal-panel create-modal-panel'
        data-testid='create-modal'
        data-create-modal='canonical'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <div className='create-modal-header'>
          <div className='create-modal-title-group'>
            <span className='create-modal-icon' data-entity-icon={icon}>
              <Icon name={icon} size={18} />
            </span>
            <h2 id={titleId} className='form-title text-primary'>
              {title}
            </h2>
          </div>
          <button
            type='button'
            className='btn btn-ghost btn-icon create-modal-close'
            onClick={onClose}
            disabled={submitting}
            aria-label={`${t('action.close')} ${title}`}
          >
            <Icon name='x' size={16} />
          </button>
        </div>
        <form className='create-modal-form' onSubmit={submit}>
          <div className='create-modal-body'>
            <div className='create-modal-fields'>{children}</div>
            {error ? (
              <div className='create-modal-error' role='alert'>
                {error}
              </div>
            ) : null}
          </div>
          <div className='create-modal-footer'>
            <button
              type='button'
              className='btn btn-secondary'
              onClick={onClose}
              disabled={submitting}
            >
              {t('action.cancel')}
            </button>
            <button
              type='submit'
              className='btn btn-primary'
              disabled={submitDisabled || submitting}
            >
              <Icon name={submitting ? 'refresh' : 'plus'} size={14} />
              {submitting ? loadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
