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

function ProfessionPreview({ layout }: { layout: string }) {
  switch (layout) {
    case "consultant":
      return <><div className="mini-head"><span>Advisory overview</span><b>Active</b></div><div className="mini-metric"><strong>24</strong><span>Client outcomes</span><i>+18%</i></div><div className="mini-service"><span>Growth Strategy</span><b>6-week sprint</b></div><button type="button" tabIndex={-1}>Book Strategy Call</button></>;
    case "lawyer":
      return <><div className="mini-head"><span>Legal counsel</span><b>Verified</b></div><div className="mini-title">Aarav Legal Partners</div><div className="mini-tags"><i>Corporate</i><i>Contracts</i><i>IP Law</i></div><div className="mini-status"><span>Consultations this week</span><b>3 slots</b></div></>;
    case "doctor":
      return <><div className="mini-head"><span>Clinic appointment</span><b>Open</b></div><div className="mini-calendar"><i>M</i><i>T</i><i className="active">W</i><i>T</i><i>F</i></div><div className="mini-slot"><span>Next available</span><strong>10:30 AM</strong><b>Book</b></div></>;
    case "finance":
      return <><div className="mini-head"><span>Tax filing</span><b>Certified</b></div><div className="mini-metric"><strong>₹8.4L</strong><span>Tax optimized</span><i>FY 25–26</i></div><div className="mini-progress"><span style={{ width: "78%" }} /></div><div className="mini-status"><span>Return status</span><b>Ready to file</b></div></>;
    case "teacher":
      return <><div className="mini-head"><span>Learning studio</span><b>4.9 ★</b></div><div className="mini-title">Mathematics made clear</div><div className="mini-tags"><i>Algebra</i><i>Calculus</i><i>Class 12</i></div><div className="mini-status"><span>Active students</span><b>248</b></div></>;
    case "freelancer":
      return <><div className="mini-head"><span>Independent designer</span><b>Available</b></div><div className="mini-tags"><i>Product UI</i><i>Brand</i><i>Webflow</i></div><div className="mini-gallery"><i /><i /><i /></div><div className="mini-status"><span>Selected work</span><b>12 projects</b></div></>;
    case "founder":
      return <><div className="mini-head"><span>Founder profile</span><b>Seed stage</b></div><div className="mini-title">Building simpler commerce</div><div className="mini-timeline"><i /><span /><i /><span /><i /></div><div className="mini-status"><span>Latest milestone</span><b>10K customers</b></div></>;
    case "photographer":
      return <><div className="mini-head"><span>Selected frames</span><b>Editorial</b></div><div className="mini-photo-grid"><i /><i /><i /></div><div className="mini-tags"><i>Portrait</i><i>Travel</i><i>Campaign</i></div></>;
    case "creator":
      return <><div className="mini-head"><span>Creator profile</span><b>Verified</b></div><div className="mini-metric"><strong>125K</strong><span>Monthly reach</span><i>+12%</i></div><div className="mini-socials"><i>in</i><i>▶</i><i>◎</i></div><div className="mini-status"><span>Brand collaborations</span><b>18 live</b></div></>;
    case "restaurant":
      return <><div className="mini-head"><span>Chef’s selection</span><b>Reserve</b></div><div className="mini-menu"><i /><div><strong>Truffle Paneer</strong><span>Modern Indian</span></div><b>₹499</b></div><div className="mini-status"><span>Tables tonight</span><b>4 available</b></div></>;
    case "property":
      return <><div className="mini-property"><span>Featured</span></div><div className="mini-title">Skyline Residences</div><div className="mini-status"><span>Whitefield, Bengaluru</span><b>₹1.8 Cr</b></div><div className="mini-tags"><i>3 bed</i><i>2 bath</i><i>1,840 sq ft</i></div></>;
    default:
      return <><div className="mini-head"><span>Product catalogue</span><b>In stock</b></div><div className="mini-products"><i /><i /><i /></div><div className="mini-tags"><i>Home</i><i>Style</i><i>Gifts</i></div><div className="mini-status"><span>New arrivals</span><b>24 items</b></div></>;
  }
}

export function TemplateCard({ template, index }: { template: Template; index: number }) {
  return (
    <article className={`template-card template-layout-${template.layout}`} style={{ "--template-delay": `${Math.min(index, 7) * 45}ms` } as React.CSSProperties}>
      <div className={`template-mockup precision-preview precision-preview-${template.layout}`} aria-hidden="true">
        <div className="precision-window"><ProfessionPreview layout={template.layout} /></div>
        <span className="template-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="template-card-body">
        <div className="template-card-topline"><span>{template.category}</span><TemplateBadge /></div>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <ul aria-label={`${template.name} feature preview`}>
          {template.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
        </ul>
        <div className="template-card-actions">
          <a href="/demo-profile" aria-label={`Preview ${template.name} template`}>Preview <span aria-hidden="true">↗</span></a>
          <button type="button" title="Template selection will be available in a future version">Use Template</button>
        </div>
      </div>
    </article>
  );
}
