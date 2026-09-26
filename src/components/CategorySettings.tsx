import { useState } from 'react'

import { Icon } from '../App'
import {
  CATEGORY_NAME_MAX_LENGTH,
  normalizeCategoryName,
  partitionCategories,
} from '../hooks/categoryModel'
import {
  type ChoreCategory,
  useCategoryMutations,
  useChoreCategories,
} from '../hooks/useChoreCategories'
import { COLORS } from '../utils/Colors'
import ColorPicker from './ColorPicker'
import { Row, Section } from './SettingsSection'

type Draft = { id?: number; name: string; color: string }

const emptyDraft: Draft = { name: '', color: COLORS.teal }

function Swatch({ color }: { color?: string }) {
  const value = color || COLORS.ash
  return (
    <span
      aria-hidden='true'
      data-testid='category-swatch'
      data-color={value}
      style={{
        width: 14,
        height: 14,
        borderRadius: 4,
        flexShrink: 0,
        background: value,
        border: '1px solid var(--line-strong)',
      }}
    />
  )
}

/**
 * Settings -> Space -> Categories.
 *
 * Manages the circle's categories through the existing /api/v1/categories
 * endpoints. Removal is archive-only, matching the API: the row keeps its id,
 * so chores, things, routine items and goals that already reference it stay
 * valid and their names keep resolving. Archived rows are listed rather than
 * hidden so they can be restored, and they are excluded from new assignment
 * because the task editor reads the active set.
 *
 * This section is intentionally not gated on team membership: a category is
 * scoped to the Circle, and a solo account has one, so the seeded defaults
 * are just as editable there.
 */
export default function CategorySettings() {
  // includeArchived so archived rows are listed with a Restore action. Task
  // pickers read the active-only query and are unaffected.
  const { categories, isLoading } = useChoreCategories({
    includeArchived: true,
  })
  const { archiveCategory, createCategory, restoreCategory, updateCategory } =
    useCategoryMutations()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { active, archived } = partitionCategories(categories)

  const startCreate = () => {
    setError(null)
    setDraft({ ...emptyDraft })
  }

  const startEdit = (category: ChoreCategory) => {
    setError(null)
    setDraft({
      id: category.id,
      name: category.name,
      color: category.color || COLORS.ash,
    })
  }

  const cancel = () => {
    setDraft(null)
    setError(null)
  }

  const save = async () => {
    if (!draft) return
    const name = normalizeCategoryName(draft.name)
    if (!name.ok) {
      setError(name.error)
      return
    }
    setError(null)
    setBusy(true)
    try {
      if (draft.id === undefined) {
        await createCategory.mutateAsync({
          name: name.name,
          color: draft.color,
        })
      } else {
        // Name and color go together: the server persists both, so an edit
        // that only renames must not blank the color.
        await updateCategory.mutateAsync({
          id: draft.id,
          name: name.name,
          color: draft.color,
        })
      }
      setDraft(null)
    } catch (caught) {
      // Surfaces the server's own message, including the 409 duplicate-name
      // response, so the user is not given a generic failure.
      setError(caught instanceof Error ? caught.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const runArchive = async (id: number, archivedNow: boolean) => {
    setError(null)
    setBusy(true)
    try {
      if (archivedNow) await archiveCategory.mutateAsync(id)
      else await restoreCategory.mutateAsync(id)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not update category',
      )
    } finally {
      setBusy(false)
    }
  }

  const renderEditor = () => {
    if (!draft) return null
    const editing = draft.id !== undefined
    return (
      <div
        className='px-5 py-4 flex flex-col gap-3'
        data-testid='category-editor'
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className='flex flex-col gap-1.5'>
          <span className='section-label' style={{ padding: 0 }}>
            NAME
          </span>
          <input
            className='input'
            aria-label='Category name'
            autoFocus
            value={draft.name}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            disabled={busy}
            onChange={event => setDraft({ ...draft, name: event.target.value })}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void save()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
            }}
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='section-label' style={{ padding: 0 }}>
            COLOR
          </span>
          <ColorPicker
            label='Category color'
            value={draft.color}
            onChange={color => setDraft({ ...draft, color })}
          />
        </div>
        <div className='flex gap-2'>
          <button
            className='btn btn-primary btn-sm'
            onClick={() => void save()}
            disabled={busy}
          >
            {editing ? 'Save changes' : 'Create category'}
          </button>
          <button
            className='btn btn-secondary btn-sm'
            onClick={cancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <Section title='Categories'>
      <div className='px-5 py-4 flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-muted' style={{ fontSize: 12, margin: 0 }}>
            Categories group your tasks, assets and goals. They are shared with
            everyone in your circle.
          </p>
          <button
            className='btn btn-primary btn-sm'
            onClick={startCreate}
            disabled={busy}
          >
            <Icon name='plus' size={14} />
            New category
          </button>
        </div>
        {error && (
          <div
            role='alert'
            data-testid='category-error'
            className='text-sig-over'
            style={{ fontSize: 12 }}
          >
            {error}
          </div>
        )}
        {renderEditor()}
      </div>

      {isLoading ? (
        <div className='px-5 py-4 text-faint' style={{ fontSize: 12 }}>
          Loading categories…
        </div>
      ) : (
        <>
          {active.map(category => (
            <Row key={category.id} icon={undefined} label={category.name}>
              <div className='flex items-center gap-3'>
                <Swatch color={category.color} />
                <button
                  className='btn btn-ghost btn-sm'
                  aria-label={'Edit ' + category.name}
                  onClick={() => startEdit(category)}
                  disabled={busy}
                >
                  <Icon name='edit' size={15} />
                </button>
                <button
                  className='btn btn-ghost btn-sm'
                  aria-label={'Archive ' + category.name}
                  title={'Archive ' + category.name}
                  onClick={() => void runArchive(category.id, true)}
                  disabled={busy}
                >
                  {/* Deliberately not a trash icon: archiving is reversible
                      and the row keeps every existing task assignment. */}
                  <Icon name='x' size={15} />
                </button>
              </div>
            </Row>
          ))}
          {active.length === 0 && !draft && (
            <div
              className='px-5 py-4 text-faint'
              style={{ fontSize: 12 }}
              data-testid='category-empty'
            >
              No categories yet. Create one to start grouping your tasks.
            </div>
          )}
        </>
      )}

      {archived.length > 0 && (
        <>
          <div className='px-5 pt-4 pb-2 section-label' style={{ padding: 0 }}>
            Archived
          </div>
          {archived.map(category => (
            <Row
              key={category.id}
              label={category.name}
              detail='Archived — existing tasks keep this category'
            >
              <div className='flex items-center gap-3'>
                <span
                  aria-hidden='true'
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    flexShrink: 0,
                    background: category.color || COLORS.ash,
                    border: '1px solid var(--line-strong)',
                    opacity: 0.45,
                  }}
                />
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => void runArchive(category.id, false)}
                  disabled={busy}
                >
                  Restore
                </button>
              </div>
            </Row>
          ))}
        </>
      )}
    </Section>
  )
}
