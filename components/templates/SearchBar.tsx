type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="template-search">
      <span className="sr-only">Search professional templates</span>
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by profession or feature"
        aria-label="Search professional templates"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear template search">
          ×
        </button>
      )}
    </label>
  );
}
