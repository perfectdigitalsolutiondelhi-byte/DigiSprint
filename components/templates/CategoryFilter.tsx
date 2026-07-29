const categories = ["All", "Business", "Professional", "Creative", "Retail", "Personal"] as const;

export type TemplateCategory = (typeof categories)[number];

type CategoryFilterProps = {
  activeCategory: TemplateCategory;
  onChange: (category: TemplateCategory) => void;
};

export function CategoryFilter({ activeCategory, onChange }: CategoryFilterProps) {
  return (
    <div className="category-filter" role="group" aria-label="Filter templates by category">
      {categories.map((category) => (
        <button
          type="button"
          key={category}
          onClick={() => onChange(category)}
          aria-pressed={activeCategory === category}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
