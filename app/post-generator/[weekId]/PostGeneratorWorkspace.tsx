"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { WeeklyPlan } from "../../../lib/marketing-strategy/weekly-schema";
import type { PostGeneratorOutput } from "../../../lib/post-generator/schema";
import { generatePostDayAction, updatePostDayAction, type PostActionState } from "./actions";
import styles from "../post-generator.module.css";

type SavedDay = { dayNumber: number; content: PostGeneratorOutput; version: number };
type Notice = string | null;
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const fields: { key: Exclude<keyof PostGeneratorOutput, "dayNumber" | "hashtags">; label: string; icon: string }[] = [
  { key: "facebookPost", label: "Facebook Post", icon: "f" }, { key: "instagramCaption", label: "Instagram Caption", icon: "IG" },
  { key: "linkedInPost", label: "LinkedIn Post", icon: "in" }, { key: "whatsAppMessage", label: "WhatsApp Message", icon: "WA" },
  { key: "xPost", label: "X Post", icon: "X" }, { key: "reelScript", label: "Reel Script", icon: ">" },
  { key: "voiceOverScript", label: "Voice-over Script", icon: "VO" }, { key: "aiImagePrompt", label: "AI Image Prompt", icon: "+" },
  { key: "callToAction", label: "Call to Action", icon: "->" },
];
const focusKey = (weekId: string) => `post-generator-focus:${weekId}`;
function rememberFocus(weekId: string, dayNumber: number) { sessionStorage.setItem(focusKey(weekId), String(dayNumber)); }
function Submit({ label, pendingLabel, secondary = false, accessibleName }: { label: string; pendingLabel: string; secondary?: boolean; accessibleName?: string }) { const { pending } = useFormStatus(); return <button aria-label={accessibleName} className={secondary ? styles.secondaryButton : styles.primaryButton} disabled={pending} type="submit">{pending ? pendingLabel : label}</button>; }
function serialize(dayName: string, content: PostGeneratorOutput) { return [`${dayName} Content Pack`, "", ...fields.flatMap((field) => [field.label.toUpperCase(), content[field.key], ""]), "HASHTAGS", content.hashtags.join(" ")].join("\n"); }

function EmptyDayCard({ weekId, dayNumber, topic }: { weekId: string; dayNumber: number; topic: string }) {
  const router = useRouter(); const [state, action] = useActionState(generatePostDayAction, { error: null } satisfies PostActionState); const dayName = dayNames[dayNumber - 1];
  useEffect(() => { if (!state.success) return; rememberFocus(weekId, dayNumber); router.refresh(); }, [dayNumber, router, state, weekId]);
  return <article className={`${styles.dayCard} ${styles.emptyDay}`}><header><div className={styles.dayNumber}>{dayNumber}</div><div><span>{dayName}</span><h2>{topic}</h2></div><span className={styles.readyBadge}>Ready</span></header><div className={styles.emptyBody}><span aria-hidden="true">+</span><strong>Create this day&apos;s content pack</strong><p>Generate platform-specific copy, scripts, image direction, CTA and hashtags from the approved plan.</p></div><form action={action}><input type="hidden" name="weekId" value={weekId}/><input type="hidden" name="dayNumber" value={dayNumber}/><input type="hidden" name="requestKey" value={`post:day:${weekId}:${dayNumber}`}/><Submit accessibleName={`Generate ${dayName} content`} label={`Generate ${dayName}`} pendingLabel="Generating content..."/>{state.error && <p className={styles.error} role="alert">{state.error}</p>}</form></article>;
}

function GeneratedDayCard({ weekId, day, topic }: { weekId: string; day: SavedDay; topic: string }) {
  const router = useRouter(); const cardRef = useRef<HTMLElement>(null); const editButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(day.content); const [notice, setNotice] = useState<Notice>(null); const [requestKey] = useState(() => `post:regen:${crypto.randomUUID()}`);
  const [editState, editAction] = useActionState(updatePostDayAction, { error: null } satisfies PostActionState); const [regenerateState, regenerateAction] = useActionState(generatePostDayAction, { error: null } satisfies PostActionState);
  const dayName = dayNames[day.dayNumber - 1]; const showEditor = editing && !editState.success;
  useEffect(() => { if (!editState.success && !regenerateState.success) return; rememberFocus(weekId, day.dayNumber); router.refresh(); }, [day.dayNumber, editState.success, regenerateState.success, router, weekId]);
  useEffect(() => { if (sessionStorage.getItem(focusKey(weekId)) !== String(day.dayNumber)) return; cardRef.current?.focus({ preventScroll: true }); sessionStorage.removeItem(focusKey(weekId)); }, [day.dayNumber, weekId]);
  async function copyAll() { try { await navigator.clipboard.writeText(serialize(dayName, day.content)); setNotice(`${dayName} content copied.`); } catch { setNotice(`Could not copy ${dayName} content. Check browser clipboard permission.`); } }
  function download() { const blob = new Blob([serialize(dayName, day.content)], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `day-${day.dayNumber}-${dayName.toLowerCase()}-posts.txt`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice(`${dayName} download started.`); }
  function cancelEdit() { setDraft(day.content); setEditing(false); window.requestAnimationFrame(() => editButtonRef.current?.focus({ preventScroll: true })); }
  return <article ref={cardRef} tabIndex={-1} className={styles.dayCard}><header><div className={styles.dayNumber}>{day.dayNumber}</div><div><span>{dayName}</span><h2>{topic}</h2></div><span className={styles.generatedBadge}>Generated</span></header>
    {showEditor ? <form action={editAction} className={styles.editForm}><input type="hidden" name="weekId" value={weekId}/><input type="hidden" name="dayNumber" value={day.dayNumber}/><input type="hidden" name="expectedVersion" value={day.version}/><input type="hidden" name="content" value={JSON.stringify(draft)}/>{fields.map((field) => <label key={field.key}><span>{field.label}</span><textarea rows={field.key === "xPost" || field.key === "callToAction" ? 3 : 6} value={draft[field.key]} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}/></label>)}<label><span>Hashtags</span><textarea rows={3} value={draft.hashtags.join(" ")} onChange={(event) => setDraft({ ...draft, hashtags: event.target.value.split(/\s+/).filter(Boolean) })}/></label><div className={styles.editActions}><button aria-label={`Cancel editing ${dayName} content`} className={styles.secondaryButton} type="button" onClick={cancelEdit}>Cancel</button><Submit accessibleName={`Save ${dayName} content`} label="Save changes" pendingLabel="Saving..."/></div>{editState.error && <p className={styles.error} role="alert">{editState.error}</p>}</form> : <><div className={styles.channelGrid}>{fields.map((field) => <section className={field.key === "aiImagePrompt" ? styles.promptSection : ""} key={field.key}><div><span aria-hidden="true">{field.icon}</span><h3>{field.label}</h3></div><p>{day.content[field.key]}</p></section>)}</div><section className={styles.hashtagSection}><h3>Hashtags</h3><div>{day.content.hashtags.map((hashtag) => <span key={hashtag}>{hashtag}</span>)}</div></section><footer className={styles.cardActions}><button ref={editButtonRef} aria-label={`Edit ${dayName} content`} type="button" onClick={() => { setNotice(null); setEditing(true); }}>Edit</button><button aria-label={`Copy ${dayName} content`} type="button" onClick={copyAll}>Copy</button><form action={regenerateAction}><input type="hidden" name="weekId" value={weekId}/><input type="hidden" name="dayNumber" value={day.dayNumber}/><input type="hidden" name="expectedVersion" value={day.version}/><input type="hidden" name="requestKey" value={requestKey}/><Submit accessibleName={`Regenerate ${dayName} content`} secondary label="Regenerate" pendingLabel="Regenerating..."/></form><button aria-label={`Download ${dayName} content`} type="button" onClick={download}>Download</button></footer>{regenerateState.error && <p className={styles.error} role="alert">{regenerateState.error}</p>}<p className={styles.srStatus} aria-live="polite" role="status">{notice}</p></>}
  </article>;
}

export function PostGeneratorWorkspace({ weekId, weekNumber, strategy, savedDays }: { weekId: string; weekNumber: number; strategy: WeeklyPlan; savedDays: SavedDay[] }) {
  return <section className={styles.workspace}><div className={styles.summaryBar}><div><span>Week</span><strong>{weekNumber}</strong></div><div><span>Weekly goal</span><strong>{strategy.weeklyGoal}</strong></div><div><span>Progress</span><strong>{savedDays.length} / 7 days</strong></div></div><div className={styles.dayList}>{strategy.contentCalendar.map((plan) => { const saved = savedDays.find((day) => day.dayNumber === plan.day); return saved ? <GeneratedDayCard key={`${plan.day}:${saved.version}`} weekId={weekId} day={saved} topic={plan.topic}/> : <EmptyDayCard key={plan.day} weekId={weekId} dayNumber={plan.day} topic={plan.topic}/>; })}</div></section>;
}
