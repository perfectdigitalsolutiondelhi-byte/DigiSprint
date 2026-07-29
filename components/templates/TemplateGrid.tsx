"use client";

import { useMemo, useState } from "react";
import { CategoryFilter, type TemplateCategory } from "./CategoryFilter";
import { SearchBar } from "./SearchBar";
import { SectionHeading } from "./SectionHeading";
import { TemplateCard, type Template } from "./TemplateCard";

const templates: Template[] = [
  {
    name: "Business Consultant",
    category: "Business",
    description: "A confident profile built to turn expertise into trusted advisory conversations.",
    suitableFor: "Consultants, strategists and advisors",
    features: ["Service packages", "Case-study highlights", "Consultation CTA"],
    monogram: "BC",
    theme: "blue",
    layout: "consultant",
  },
  {
    name: "Lawyer",
    category: "Professional",
    description: "A composed professional presence that communicates credibility and specialist experience.",
    suitableFor: "Advocates, legal counsel and firms",
    features: ["Practice areas", "Credentials", "Appointment links"],
    monogram: "LW",
    theme: "indigo",
    layout: "lawyer",
  },
  {
    name: "Doctor",
    category: "Professional",
    description: "A reassuring profile for presenting clinical expertise, services and patient access.",
    suitableFor: "Doctors, specialists and clinics",
    features: ["Specializations", "Clinic hours", "Patient contact"],
    monogram: "DR",
    theme: "cyan",
    layout: "doctor",
  },
  {
    name: "CA",
    category: "Professional",
    description: "A precise digital profile for financial professionals who lead with clarity and trust.",
    suitableFor: "Chartered accountants and tax experts",
    features: ["Advisory services", "Certifications", "Enquiry CTA"],
    monogram: "CA",
    theme: "violet",
    layout: "finance",
  },
  {
    name: "Teacher",
    category: "Personal",
    description: "A warm, structured profile that showcases teaching philosophy and learning outcomes.",
    suitableFor: "Educators, tutors and coaches",
    features: ["Subject expertise", "Student results", "Class enquiries"],
    monogram: "TE",
    theme: "sky",
    layout: "teacher",
  },
  {
    name: "Freelancer",
    category: "Creative",
    description: "A flexible portfolio-led profile designed to make independent talent easy to hire.",
    suitableFor: "Designers, writers and developers",
    features: ["Work portfolio", "Skill stack", "Availability status"],
    monogram: "FR",
    theme: "purple",
    layout: "freelancer",
  },
  {
    name: "Startup Founder",
    category: "Business",
    description: "A visionary founder profile connecting mission, momentum and meaningful achievements.",
    suitableFor: "Founders, operators and executives",
    features: ["Company story", "Milestones", "Press and contact"],
    monogram: "SF",
    theme: "electric",
    layout: "founder",
  },
  {
    name: "Photographer",
    category: "Creative",
    description: "A cinematic, image-first experience made to let memorable work take the lead.",
    suitableFor: "Photographers and visual artists",
    features: ["Gallery showcase", "Shoot categories", "Booking CTA"],
    monogram: "PH",
    theme: "magenta",
    layout: "photographer",
  },
  {
    name: "Influencer",
    category: "Personal",
    description: "A vibrant media profile that brings audience reach, partnerships and content together.",
    suitableFor: "Creators and public personalities",
    features: ["Audience metrics", "Brand work", "Social links"],
    monogram: "IN",
    theme: "aurora",
    layout: "creator",
  },
  {
    name: "Restaurant",
    category: "Retail",
    description: "An inviting digital destination for turning discovery into visits and reservations.",
    suitableFor: "Restaurants, cafés and chefs",
    features: ["Menu preview", "Opening hours", "Maps and booking"],
    monogram: "RS",
    theme: "royal",
    layout: "restaurant",
  },
  {
    name: "Real Estate",
    category: "Business",
    description: "A polished property profile that helps buyers discover listings and act with confidence.",
    suitableFor: "Agents, brokers and developers",
    features: ["Featured listings", "Local expertise", "Site-visit CTA"],
    monogram: "RE",
    theme: "ocean",
    layout: "property",
  },
  {
    name: "Shop Owner",
    category: "Retail",
    description: "A modern storefront profile connecting local customers with products and directions.",
    suitableFor: "Retailers and independent shops",
    features: ["Product categories", "Business hours", "WhatsApp orders"],
    monogram: "SO",
    theme: "nebula",
    layout: "shop",
  },
];

export function TemplateGrid() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesCategory = activeCategory === "All" || template.category === activeCategory;
      const searchable = [
        template.name,
        template.category,
        template.description,
        template.suitableFor,
        ...template.features,
      ].join(" ").toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [activeCategory, search]);

  return (
    <section className="templates-section" id="templates" aria-labelledby="templates-title">
      <SectionHeading />
      <div className="template-toolbar">
        <CategoryFilter activeCategory={activeCategory} onChange={setActiveCategory} />
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="template-results" aria-live="polite">
        <span>{filteredTemplates.length} templates</span>
        <span>{activeCategory === "All" ? "All professions" : activeCategory}</span>
      </div>
      {filteredTemplates.length > 0 ? (
        <div className="template-grid">
          {filteredTemplates.map((template, index) => (
            <TemplateCard template={template} index={index} key={template.name} />
          ))}
        </div>
      ) : (
        <div className="template-empty" role="status">
          <span aria-hidden="true">⌕</span>
          <h3>No templates found</h3>
          <p>Try a different profession, feature, or category.</p>
          <button type="button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>
            View all templates
          </button>
        </div>
      )}
    </section>
  );
}
