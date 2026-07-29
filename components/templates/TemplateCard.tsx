import { TemplateBadge } from "./TemplateBadge";
import type { TemplateCategory } from "./CategoryFilter";

export type Template = {
  name: string;
  category: Exclude<TemplateCategory, "All">;
  description: string;
  suitableFor: string;
  features: string[];
  monogram: string;
  theme: string;
  layout: string;
};

const previewDetails: Record<string, { label: string; action: string }> = {
  consultant: { label: "Advisory dashboard", action: "Book strategy call" },
  lawyer: { label: "Legal counsel", action: "Request consultation" },
  doctor: { label: "Clinic profile", action: "Book appointment" },
  finance: { label: "Financial advisory", action: "View tax services" },
  teacher: { label: "Learning studio", action: "Explore courses" },
  freelancer: { label: "Portfolio available", action: "View selected work" },
  founder: { label: "Founder profile", action: "Company highlights" },
  photographer: { label: "Visual stories", action: "Open gallery" },
  creator: { label: "Creator profile", action: "View collaborations" },
  restaurant: { label: "Open for dining", action: "Reserve a table" },
  property: { label: "Featured property", action: "Schedule a visit" },
  shop: { label: "New collection", action: "Browse catalogue" },
};

export function TemplateCard({ template, index }: { template: Template; index: number }) {
  const preview = previewDetails[template.layout];

  return (
    <article
      className={`template-card template-layout-${template.layout}`}
      style={{ "--template-delay": `${Math.min(index, 7) * 55}ms` } as React.CSSProperties}
    >
      <div className={`template-mockup profession-preview preview-layout-${template.layout}`} aria-hidden="true">
        <div className={`profession-art profession-art-${template.layout}`} />
        <div className="profession-image-shade" />
        <div className="profession-preview-top">
          <span className={`profession-icon profession-icon-${template.layout}`} />
          <span>{preview.label}</span>
        </div>
        <div className="profession-preview-bottom">
          <div>
            <small>{template.category}</small>
            <strong>{template.name}</strong>
          </div>
          <span>{preview.action}</span>
        </div>
        <span className="template-index">{String(index + 1).padStart(2, "0")}</span>
      </div>

      <div className="template-card-body">
        <div className="template-card-topline">
          <span>{template.category}</span>
          <TemplateBadge />
        </div>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <ul aria-label={`${template.name} feature preview`}>
          {template.features.map((feature) => (
            <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>
          ))}
        </ul>
        <div className="template-card-actions">
          <a href="/demo-profile" aria-label={`Preview ${template.name} template`}>
            Preview <span aria-hidden="true">↗</span>
          </a>
          <button type="button" title="Template selection will be available in a future version">
            Use Template
          </button>
        </div>
      </div>
    </article>
  );
}
