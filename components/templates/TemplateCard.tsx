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

export function TemplateCard({ template, index }: { template: Template; index: number }) {
  return (
    <article
      className={`template-card template-layout-${template.layout}`}
      style={{ "--template-delay": `${Math.min(index, 7) * 55}ms` } as React.CSSProperties}
    >
      <div className={`template-mockup template-theme-${template.theme} preview-layout-${template.layout}`} aria-hidden="true">
        <div className="mockup-browser">
          <div className="mockup-bar"><i /><i /><i /></div>
          <div className={`mockup-content preview-ui-${template.layout}`}>
            <div className="mockup-avatar">{template.monogram}</div>
            <span className="mockup-kicker">{template.category}</span>
            <strong>{template.name}</strong>
            <span className="mockup-line mockup-line-wide" />
            <span className="mockup-line" />
            <div className="preview-special">
              {template.features.map((feature, featureIndex) => (
                <span key={feature}><i />{featureIndex === 0 && <b>{feature}</b>}</span>
              ))}
            </div>
            <div className="mockup-actions"><i /><i /></div>
          </div>
        </div>
        <div className="mockup-phone">
          <span className="mockup-notch" />
          <div className="phone-avatar">{template.monogram}</div>
          <i /><i /><i />
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
        <div className="suitable-for">
          <span>Suitable for</span>
          <strong>{template.suitableFor}</strong>
        </div>
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
