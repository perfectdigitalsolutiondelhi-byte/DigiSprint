"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { approveStageAction, generateWeekAction, saveStageAction, type WeeklyActionState } from "./actions";
import styles from "./weekly.module.css";

type Stage = { number: number; title: string; status: "draft" | "approved" | "pending"; version: number; content: unknown };
type ScrollRequest = { y: number; targetId?: string };
const scrollKey = (runId: string) => `weekly-strategy-scroll:${runId}`;
function rememberScroll(runId: string, targetId?: string) { sessionStorage.setItem(scrollKey(runId), JSON.stringify({ y: window.scrollY, targetId } satisfies ScrollRequest)); }
function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) { const { pending } = useFormStatus(); return <button disabled={pending} type="submit">{pending ? pendingLabel : label}</button>; }
function JsonView({ value }: { value: unknown }) { return <pre className={styles.output}>{JSON.stringify(value, null, 2)}</pre>; }
function StageEditor({ runId, stage }: { runId: string; stage: Stage }) {
  const router = useRouter(); const pathname = usePathname();
  const [editing, setEditing] = useState(false); const editButton = useRef<HTMLButtonElement>(null);
  const [saveState, saveAction] = useActionState(saveStageAction, { error: null } satisfies WeeklyActionState);
  const [approveState, approveAction] = useActionState(approveStageAction, { error: null } satisfies WeeklyActionState);
  useEffect(() => { if (!editing) editButton.current?.focus({ preventScroll: true }); }, [editing]);
  useEffect(() => { if (!saveState.success) return; rememberScroll(runId); router.refresh(); }, [runId, router, saveState]);
  useEffect(() => { if (!approveState.success || approveState.stageNumber === undefined) return; const nextStage = Math.min(4, approveState.stageNumber + 1); rememberScroll(runId, `stage-${nextStage}`); router.replace(`${pathname}?stage=${nextStage}`, { scroll: false }); router.refresh(); }, [approveState, pathname, router, runId]);
  if (stage.status === "pending") return null;
  return <section id={`stage-${stage.number}`} className={styles.stage} aria-labelledby={`stage-${stage.number}-title`}><div className={styles.stageHead}><div><h2 id={`stage-${stage.number}-title`}>{stage.title}</h2><span>{stage.status === "approved" ? "Approved - Read only" : "Draft"}</span></div>{stage.status === "draft" && !editing && <button ref={editButton} type="button" onClick={() => setEditing(true)} aria-label={`Edit ${stage.title}`}>Edit</button>}</div>
    {editing ? <form action={saveAction} onSubmit={() => { rememberScroll(runId); setEditing(false); }}><input type="hidden" name="runId" value={runId}/><input type="hidden" name="stageNumber" value={stage.number}/><input type="hidden" name="version" value={stage.version}/><label htmlFor={`content-${stage.number}`}>Structured {stage.title} content</label><textarea id={`content-${stage.number}`} name="content" defaultValue={JSON.stringify(stage.content, null, 2)} rows={24}/><div className={styles.actions}><Submit label="Save" pendingLabel="Saving..."/><button type="button" onClick={() => setEditing(false)}>Cancel</button></div>{saveState.error && <p role="alert">{saveState.error}</p>}</form> : <JsonView value={stage.content}/>}
    {stage.status === "draft" && !editing && <form action={approveAction} onSubmit={() => rememberScroll(runId)}><input type="hidden" name="runId" value={runId}/><input type="hidden" name="stageNumber" value={stage.number}/><Submit label={`Approve ${stage.title}`} pendingLabel="Approving..."/>{approveState.error && <p role="alert">{approveState.error}</p>}</form>}
  </section>;
}
export function WeeklyWorkspace({ runId, stages, currentStage, revisions, selectedRevision }: { runId: string; stages: Stage[]; currentStage: number; revisions: { revision_number: number; created_at: string }[]; selectedRevision: unknown }) {
  const router = useRouter(); const pathname = usePathname();
  const [generateState, generateAction] = useActionState(generateWeekAction, { error: null } satisfies WeeklyActionState);
  const next = stages.find((stage) => stage.status === "pending" && (stage.number === 1 ? stages[0].status === "approved" : stages[stage.number - 1]?.status === "approved"));
  const stageSignature = stages.map((stage) => `${stage.number}:${stage.status}:${stage.version}`).join("|");
  useEffect(() => { const raw = sessionStorage.getItem(scrollKey(runId)); if (!raw) return; const request = JSON.parse(raw) as ScrollRequest; requestAnimationFrame(() => { if (request.targetId) { const target = document.getElementById(request.targetId); if (!target) return; target.scrollIntoView({ behavior: "smooth", block: "start" }); } else window.scrollTo({ top: request.y, behavior: "auto" }); sessionStorage.removeItem(scrollKey(runId)); }); }, [currentStage, runId, stageSignature]);
  useEffect(() => { if (!generateState.success || generateState.stageNumber === undefined) return; rememberScroll(runId, `stage-${generateState.stageNumber}`); router.replace(`${pathname}?stage=${generateState.stageNumber}`, { scroll: false }); router.refresh(); }, [generateState, pathname, router, runId]);
  return <><nav className={styles.progress} aria-label="Strategy generation progress">{stages.map((stage) => <Link key={stage.number} href={`?stage=${stage.number}`} scroll={false} aria-current={stage.number === currentStage ? "step" : undefined}><span>{stage.status === "approved" ? "OK" : stage.number === 0 ? "F" : stage.number}</span>{stage.title}</Link>)}</nav>
    {selectedRevision ? <section className={styles.stage}><h2>Previous revision</h2><p>This immutable snapshot is read only.</p><JsonView value={selectedRevision}/></section> : <StageEditor runId={runId} stage={stages[currentStage] ?? stages[0]}/>}
    {next && <form id={`stage-${next.number}`} action={generateAction} onSubmit={() => rememberScroll(runId)} className={styles.generate}><input type="hidden" name="runId" value={runId}/><input type="hidden" name="stageNumber" value={next.number}/><div><strong>Ready for {next.title}</strong><span>Estimated generation time: 10-25 seconds</span></div><Submit label={`Generate ${next.title}`} pendingLabel={`Generating ${next.title}...`}/>{generateState.error && <p role="alert">{generateState.error}</p>}</form>}
    {revisions.length > 0 && <aside className={styles.revisions}><h2>Revision history</h2><Link scroll={false} href={`?stage=${currentStage}`}>Current</Link>{revisions.map((revision) => <Link scroll={false} key={revision.revision_number} href={`?stage=${currentStage}&revision=${revision.revision_number}`}>Revision {revision.revision_number} - {new Date(revision.created_at).toLocaleDateString()}</Link>)}</aside>}
  </>;
}
