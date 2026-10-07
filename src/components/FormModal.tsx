import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { Icon } from '../App'

type FormModalProps = {
  /** Modal title. Uses the Project editor's form-title treatment. */
  title: string
  onClose: () => void
  /** Form fields. Use the Project editor pattern: section-label + input,
   *  grid gap-4, IconPicker/ThemeSelect where needed. */
  children: ReactNode
  /** Footer actions. Use the Project pattern: primary create/save +
   *  secondary cancel in a flex gap-2 row (not flex-1 like the task popup). */
  actions: ReactNode
  maxWidth?: number
}

/**
 * Shared creation-modal shell (Fix 02).
 *
 * Visual + interaction reference is the PROJECT creation editor
 * (ProjectsScreen inline card: form-title 16px + ghost X header,
 * grid gap-4 fields with section-label, flex gap-2 footer), presented
 * in the existing shared overlay pattern (modal-overlay + modal-panel,
 * overlay-click/Escape/X/Cancel dismiss, responsive 90dvh scroll).
 *
 * Deliberately NOT modelled on the task creation popup (which uses
 * flex-1 footer buttons and a different field structure).
 */
export default function FormModal({
  actions,
  children,
  maxWidth = 560,
  onClose,
  title,
}: FormModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        role='dialog'
        aria-modal='true'
        aria-label={title}
        style={{ maxWidth }}
        onClick={event => event.stopPropagation()}
      >
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'
          style={{ borderColor: 'var(--line)' }}
        >
          <div className='form-title text-primary' style={{ fontSize: 16 }}>
            {title}
          </div>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <Icon name='x' size={16} />
          </button>
        </div>
        <div className='px-6 py-5'>
          <div className='grid gap-4'>{children}</div>
          <div className='flex gap-2 mt-4'>{actions}</div>
        </div>
      </div>
    </div>
  )
}
