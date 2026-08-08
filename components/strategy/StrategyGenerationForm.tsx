"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { generateMarketingStrategy, type StrategyActionState } from "../../app/strategy/actions";
function SubmitButton(){const { pending }=useFormStatus();return <button className="strategy-primary" disabled={pending} type="submit">{pending ? "Building your strategy…" : "Generate Marketing Strategy"}</button>}
export function StrategyGenerationForm({ defaultLanguage = "en" }: { defaultLanguage?: string }) {
  const [state, action] = useActionState(generateMarketingStrategy, { error: null } satisfies StrategyActionState);
  const [requestKey] = useState(() => `strategy:generate:${crypto.randomUUID()}`);
  return <form action={action} className="strategy-form"><input name="idempotencyKey" type="hidden" value={requestKey}/><label>Primary marketing objective<input name="primaryObjective" defaultValue="Build consistent visibility and generate qualified enquiries" maxLength={160} required/></label><label>Strategy language<select name="preferredLanguage" defaultValue={["en","hi","hinglish"].includes(defaultLanguage) ? defaultLanguage : "en"}><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option></select></label><label className="strategy-form-wide">Special focus <span>Optional</span><textarea name="specialFocus" maxLength={500} rows={3} placeholder="Example: Improve local discovery and WhatsApp enquiries"/></label>{state.error&&<p className="strategy-error" role="alert">{state.error}</p>}<SubmitButton/></form>;
}
