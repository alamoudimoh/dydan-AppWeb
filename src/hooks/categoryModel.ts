/**
 * Pure helpers shared by the category manager and its tests.
 *
 * Kept separate from the hook so the rules that decide whether a write is
 * allowed (name trimming, empty rejection, the server's duplicate-name
 * response) can be exercised without a React tree or a network.
 */

/** Matches the server's own limit in CreateCategory/UpdateCategory. */
export const CATEGORY_NAME_MAX_LENGTH = 80

export type CategoryNameResult =
  { ok: true; name: string } | { ok: false; error: string }

/**
 * Normalizes a user-entered category name.
 *
 * Whitespace is trimmed before the empty check so a name of only spaces is
 * rejected rather than stored, and the length check runs on runes so a name
 * of multi-byte characters is not cut off mid-character. The bounds mirror
 * the server, which re-validates and would otherwise reject the write with
 * a less specific message.
 */
export function normalizeCategoryName(raw: string): CategoryNameResult {
  const name = raw.trim()
  if (!name) {
    return { ok: false, error: 'Category name cannot be empty' }
  }
  if ([...name].length > CATEGORY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Category name cannot be longer than ${CATEGORY_NAME_MAX_LENGTH} characters`,
    }
  }
  return { ok: true, name }
}

/** True when a category row is archived, per the API's `archivedAt`. */
export function isArchived(category: { archivedAt?: string | null }) {
  return Boolean(category.archivedAt)
}

/**
 * Splits a category list into the active and archived groups the manager
 * renders. Archived rows keep their id and name so a task that still points
 * at them resolves, they are only hidden from new assignment.
 */
export function partitionCategories<T extends { archivedAt?: string | null }>(
  categories: readonly T[],
): { active: T[]; archived: T[] } {
  const active: T[] = []
  const archived: T[] = []
  for (const category of categories) {
    if (isArchived(category)) archived.push(category)
    else active.push(category)
  }
  return { active, archived }
}

type CategoryResponse = {
  error?: string
  message?: string
  res?: unknown
}

/**
 * Unwraps a category write response.
 *
 * The category endpoints answer `{ res: … }` on success and `{ error: … }`
 * on failure, so the server's message is surfaced verbatim. That matters for
 * the duplicate-name case: the server answers 409 with
 * "a category with this name already exists" and the manager shows exactly
 * that rather than a generic failure.
 */
export async function readCategoryResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as CategoryResponse
  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || `Request failed (${response.status})`,
    )
  }
  return (body?.res ?? body) as T
}
