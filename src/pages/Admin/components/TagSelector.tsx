import React from 'react';

interface TagOption {
  id: string;
  name: string;
}

interface TagSelectorProps {
  label: string;
  options: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({ label, options, selectedIds, onChange }: TagSelectorProps) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Get selected items
  const selectedItems = React.useMemo(
    () => options.filter((opt) => selectedIds.includes(opt.id)),
    [options, selectedIds],
  );

  // Filter available options by search
  const filteredOptions = React.useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return options.filter((opt) => {
      if (selectedIds.includes(opt.id)) return false; // Hide already selected
      if (!searchLower) return true;
      return opt.name.toLowerCase().includes(searchLower);
    });
  }, [options, selectedIds, search]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function addTag(id: string) {
    onChange([...selectedIds, id]);
    setSearch('');
  }

  function removeTag(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  return (
    <div className="tag-selector" ref={containerRef}>
      <label className="tag-selector__label">{label}</label>

      {/* Selected tags */}
      <div className="tag-selector__selected">
        {selectedItems.map((item) => (
          <span key={item.id} className="tag-selector__chip">
            {item.name}
            <button type="button" onClick={() => removeTag(item.id)} aria-label={`Remove ${item.name}`}>
              ×
            </button>
          </span>
        ))}
        {selectedItems.length === 0 && <span className="tag-selector__placeholder">None selected</span>}
      </div>

      {/* Search input */}
      <div className="tag-selector__input-wrapper">
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="tag-selector__input"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="tag-selector__dropdown">
          {filteredOptions.length === 0 ? (
            <div className="tag-selector__no-results">
              {search ? 'No matches found' : 'All selected'}
            </div>
          ) : (
            <ul className="tag-selector__options">
              {filteredOptions.slice(0, 20).map((opt) => (
                <li key={opt.id}>
                  <button type="button" onClick={() => addTag(opt.id)}>
                    {opt.name}
                  </button>
                </li>
              ))}
              {filteredOptions.length > 20 && (
                <li className="tag-selector__more">
                  +{filteredOptions.length - 20} more — type to search
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
