"use client";

import { useActionState, useRef, useState } from "react";
import { completeBusinessSetup } from "../../app/setup/actions";
import type { SetupState } from "../../app/setup/actions";

const initialState: SetupState = { error: "" };

const industries = ["Restaurant & Food", "Retail & Shop", "Professional Services", "Health & Wellness", "Education", "Beauty & Lifestyle", "Real Estate", "Other"];
const tones = [
  { value: "friendly", label: "Friendly", detail: "Warm, simple and welcoming" },
  { value: "professional", label: "Professional", detail: "Clear, credible and assured" },
  { value: "energetic", label: "Energetic", detail: "Bold, lively and action-focused" },
  { value: "premium", label: "Premium", detail: "Refined, selective and polished" },
];

export function BusinessSetupForm({ configured }: { configured: boolean }) {
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(completeBusinessSetup, initialState);
  function continueToNextStep() {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const fields = section?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
    for (const field of fields ?? []) {
      if (!field.checkValidity()) { field.reportValidity(); return; }
    }
    setStep((value) => Math.min(3, value + 1));
  }

  return (
    <form action={formAction} className="setup-form" ref={formRef}>
      <div className="setup-progress" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((item) => <span className={item <= step ? "active" : ""} key={item}><i>{item}</i>{item === 1 ? "Business" : item === 2 ? "Brand" : "Marketing"}</span>)}</div>
      {!configured && <div className="auth-notice" role="status">Preview mode: connect Supabase to save and complete this setup.</div>}

      <section className="setup-step" data-step="1" hidden={step !== 1}>
        <div className="setup-heading"><span>Step 1 · Business basics</span><h1>Tell DigiSprint about your business.</h1><p>This context makes every future suggestion more useful and specific.</p></div>
        <div className="setup-fields two-column">
          <label>Business name<input name="name" placeholder="e.g. Namma Masala" required /></label>
          <label>Industry<select name="industry" required defaultValue=""><option disabled value="">Choose your industry</option>{industries.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
          <label className="wide">What does your business offer?<textarea name="description" placeholder="Describe your products, services and what makes your business useful." required rows={4} /></label>
          <label>City<input name="city" placeholder="Bengaluru" required /></label><label>State<input name="state" placeholder="Karnataka" required /></label>
          <label className="wide">WhatsApp number <small>Optional</small><input inputMode="tel" name="whatsapp" placeholder="+91 98765 43210" /></label>
        </div>
      </section>

      <section className="setup-step" data-step="2" hidden={step !== 2}>
        <div className="setup-heading"><span>Step 2 · Brand personality</span><h1>How should your business sound?</h1><p>Choose the voice and language customers should recognise as yours.</p></div>
        <fieldset className="choice-grid tone-grid"><legend>Brand tone</legend>{tones.map((tone) => <label key={tone.value}><input name="tone" required type="radio" value={tone.value} /><span><strong>{tone.label}</strong><small>{tone.detail}</small></span></label>)}</fieldset>
        <fieldset className="choice-grid compact-choices"><legend>Content languages</legend>{[["en","English"],["hi","Hindi"],["hinglish","Hinglish"],["regional","Regional language"]].map(([value,label]) => <label key={value}><input name="languages" type="checkbox" value={value} defaultChecked={value === "en"} /><span>{label}</span></label>)}</fieldset>
        <label className="color-field">Primary brand colour<input defaultValue="#6366F1" name="primaryColor" type="color" /><span>Used as a starting point for future creatives.</span></label>
      </section>

      <section className="setup-step" data-step="3" hidden={step !== 3}>
        <div className="setup-heading"><span>Step 3 · Marketing rhythm</span><h1>What should DigiSprint help you achieve?</h1><p>Set a practical starting rhythm. You can adjust these choices later.</p></div>
        <fieldset className="choice-grid compact-choices"><legend>Where do you market?</legend>{[["instagram","Instagram"],["facebook","Facebook"],["whatsapp","WhatsApp"],["google-business","Google Business"]].map(([value,label]) => <label key={value}><input name="platforms" type="checkbox" value={value} defaultChecked={value === "instagram"} /><span>{label}</span></label>)}</fieldset>
        <fieldset className="choice-grid compact-choices"><legend>Main goals</legend>{[["visibility","Stay visible"],["sales","Increase sales"],["trust","Build customer trust"],["offers","Promote offers"]].map(([value,label]) => <label key={value}><input name="goals" type="checkbox" value={value} defaultChecked={value === "visibility"} /><span>{label}</span></label>)}</fieldset>
        <div className="setup-fields two-column"><label className="wide">Who are your ideal customers?<textarea name="targetAudience" placeholder="e.g. Working professionals and families within 5 km of our restaurant." required rows={3} /></label><label>Posts per week<input defaultValue="3" max="14" min="1" name="postsPerWeek" required type="number" /></label></div>
      </section>

      {state.error && <p className="setup-error" role="alert">{state.error}</p>}
      <div className="setup-actions">{step > 1 && <button className="setup-back" onClick={() => setStep((value) => value - 1)} type="button">Back</button>}<span>Step {step} of 3</span>{step < 3 ? <button className="setup-next" onClick={continueToNextStep} type="button">Continue <i>→</i></button> : <button className="setup-next" disabled={!configured || pending} type="submit">{pending ? "Creating workspace…" : "Complete setup"} <i>→</i></button>}</div>
    </form>
  );
}
