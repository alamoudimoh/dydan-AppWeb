import CustomFilterChips from './CustomFilterChips'

const FilterSection = ({
  activeFilterId,
  onFilterClick,

  onFilterDelete,
  onFilterEdit,
  onFilterPin,
  savedFilters,
}) => {
  return (
    <>
      {/* Custom Filter Chips */}
      {savedFilters.length > 0 && (
        <div style={{ marginTop: '0.25rem' }}>
          <CustomFilterChips
            filters={savedFilters}
            activeFilterId={activeFilterId}
            onFilterClick={onFilterClick}
            onFilterDelete={onFilterDelete}
            onFilterPin={onFilterPin}
            onFilterEdit={onFilterEdit}
          />
        </div>
      )}

      {/* Active Custom Filter Display */}
    </>
  )
}

export default FilterSection
