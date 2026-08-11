"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCampaignAction, type CampaignActionState } from "./actions";
import styles from "./campaign-studio.module.css";

type Week = { id: string; weekNumber: number; weeklyGoal: string; postIds: { id: string; dayNumber: number }[] };
const initialState: CampaignActionState = { error: null };

function SubmitButton() { const { pending } = useFormStatus(); return <button className={styles.primary} disabled={pending} type="submit">{pending ? "Creating…" : "Create campaign"}</button>; }

export function CampaignBuilder({ weeks }: { weeks: Week[] }) {
  const [state, action] = useActionState(createCampaignAction, initialState);
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [requestKey] = useState(() => `campaign:create:${crypto.randomUUID()}`);
  const week = useMemo(() => weeks.find((item) => item.id === weekId), [weekId, weeks]);
  useEffect(() => { if (state.error) document.getElementById("campaign-builder-error")?.focus(); }, [state.error]);
  return <section className={styles.builder} aria-labelledby="campaign-builder-title"><div className={styles.builderIntro}><span>Campaign Builder</span><h2 id="campaign-builder-title">Start with approved work</h2><p>Campaign Studio uses only an approved weekly strategy and the generated posts you explicitly select.</p></div>
    {weeks.length ? <form action={action} className={styles.form}><input name="requestKey" type="hidden" value={requestKey}/><label>Campaign name<input name="name" maxLength={120} required placeholder="August growth campaign"/></label><label>Campaign objective<textarea name="objective" maxLength={500} required rows={3} placeholder="Describe the measurable result this campaign should achieve."/></label><label>Approved strategy week<select name="weekId" value={weekId} onChange={(event) => setWeekId(event.target.value)} required>{weeks.map((item) => <option value={item.id} key={item.id}>Week {item.weekNumber} — {item.weeklyGoal}</option>)}</select></label>
      <fieldset><legend>Approved AI posts</legend><p>Select the post days to include as campaign source material.</p><div className={styles.dayChoices}>{week?.postIds.map((post) => <label key={post.id}><input type="checkbox" name="sourcePostIds" value={post.id}/><span>Day {post.dayNumber}</span></label>)}</div>{!week?.postIds.length && <small>No generated posts are available for this approved week.</small>}</fieldset>
      {state.error && <p id="campaign-builder-error" className={styles.error} role="alert" tabIndex={-1}>{state.error}</p>}<SubmitButton/>
    </form> : <div className={styles.empty}><h3>No eligible source weeks</h3><p>Approve a weekly strategy and generate its posts before building a campaign.</p></div>}
  </section>;
}
