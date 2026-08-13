export const categoryCatalog = response =>
  Array.isArray(response?.res) ? response.res : []

export const activeCategories = categories =>
  categories.filter(category => !category.archivedAt)
