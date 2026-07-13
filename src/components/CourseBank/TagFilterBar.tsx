interface TagFilterBarProps {
  allTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClear: () => void
}

// Filter options are derived from tags on existing classes; multi-select uses OR logic
export function TagFilterBar({ allTags, selectedTags, onToggleTag, onClear }: TagFilterBarProps) {
  if (allTags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
              isSelected
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-500'
            }`}
          >
            {tag}
          </button>
        )
      })}
      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="px-1.5 text-xs text-gray-400 underline hover:text-gray-600"
        >
          clear
        </button>
      )}
    </div>
  )
}
