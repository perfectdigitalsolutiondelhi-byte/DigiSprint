"use client";

import { useActionState } from "react";
import { updateBusinessSettings } from "./actions";
import type { BusinessSettingsRecord } from "../../../lib/business-settings/workspace";
import type { BusinessSettingsInput, BusinessSettingsState } from "../../../lib/business-settings/schema";
import styles from "./business-settings.module.css";

const initialState: BusinessSettingsState = { success: false, error: null };

function FieldError({ field, state }: { field: keyof BusinessSettingsInput; state: BusinessSettingsState }) {
  const message = state.error?.fields?.[field]?.[0];
  return message ? <small className={styles.fieldError}>{message}</small> : null;
}

export function BusinessSettingsForm({ business, canEdit }: { business: BusinessSettingsRecord; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateBusinessSettings, initialState);
  return (
    <form action={action} className={styles.form}>
      {!canEdit && <p className={styles.notice}>Only the workspace owner can edit these settings.</p>}
      <div className={styles.grid}>
        <label>Business Name<input defaultValue={business.name} disabled={!canEdit} maxLength={120} name="name" required /><FieldError field="name" state={state} /></label>
        <label>Industry<input defaultValue={business.industry ?? ""} disabled={!canEdit} maxLength={120} name="industry" required /><FieldError field="industry" state={state} /></label>
        <label className={styles.wide}>Business Description<textarea defaultValue={business.description ?? ""} disabled={!canEdit} maxLength={2000} name="description" rows={5} /><FieldError field="description" state={state} /></label>
        <label className={styles.wide}>Target Audience<textarea defaultValue={business.targetAudience ?? ""} disabled={!canEdit} maxLength={1000} name="targetAudience" rows={4} /><FieldError field="targetAudience" state={state} /></label>
        <label>Website<input defaultValue={business.website ?? ""} disabled={!canEdit} maxLength={500} name="website" placeholder="https://example.com" type="url" /><FieldError field="website" state={state} /></label>
        <label>Phone<input defaultValue={business.phone ?? ""} disabled={!canEdit} inputMode="tel" maxLength={40} name="phone" /><FieldError field="phone" state={state} /></label>
        <label>Email<input defaultValue={business.email ?? ""} disabled={!canEdit} maxLength={320} name="email" type="email" /><FieldError field="email" state={state} /></label>
        <label className={styles.wide}>Address<textarea defaultValue={business.address ?? ""} disabled={!canEdit} maxLength={500} name="address" rows={3} /><FieldError field="address" state={state} /></label>
        <label>City<input defaultValue={business.city ?? ""} disabled={!canEdit} maxLength={120} name="city" /><FieldError field="city" state={state} /></label>
        <label>State<input defaultValue={business.state ?? ""} disabled={!canEdit} maxLength={120} name="state" /><FieldError field="state" state={state} /></label>
        <label>Country<input defaultValue={business.country} disabled={!canEdit} maxLength={120} name="country" required /><FieldError field="country" state={state} /></label>
      </div>
      {state.error && <p className={styles.error} role="alert">{state.error.message}</p>}
      {state.success && <p className={styles.success} role="status">Business settings saved.</p>}
      <button className="strategy-primary" disabled={!canEdit || pending} type="submit">{pending ? "Saving…" : "Save Business Settings"}</button>
    </form>
  );
}