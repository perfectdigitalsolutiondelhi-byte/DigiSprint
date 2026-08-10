"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { StrategyReview } from "../../../lib/marketing-strategy/review-queries";
import type { ReviewSectionKey } from "../../../lib/marketing-strategy/review-schema";
import { StrategyView } from "../../../components/strategy/StrategyView";
import { regenerateMarketingStrategy } from "../actions";
import { changeStrategyStatus, saveStrategySection, type ReviewActionState } from "./review-actions";
import styles from "./review.module.css";

const initialState: ReviewActionState = { success: false, error: null };
const labels: Record<ReviewSectionKey, string> = {
  businessSummary:"Business Summary",objective:"Objective",language:"Language",specialFocus:"Special Focus",
  executiveSummary:"Executive Summary",swot:"SWOT",targetAudience:"Target Audience",positioning:"Positioning",
  marketingChannels:"Marketing Channels",weeklyPlan:"Weekly Plan",calendar:"30-Day Calendar",budget:"Budget",kpis:"KPIs",checklist:"Checklist",
};
const plainSections = new Set<ReviewSectionKey>(["objective","language","specialFocus","executiveSummary"]);

function ReadableValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <p className={styles.empty}>Not specified.</p>;
  if (typeof value === "string" || typeof value === "number") return <p>{String(value)}</p>;
  if (Array.isArray(value)) return <ul className={styles.valueList}>{value.map((item,index)=><li key={index}><ReadableValue value={item}/></li>)}</ul>;
  if (typeof value === "object") return <dl className={styles.valueGrid}>{Object.entries(value as Record<string,unknown>).map(([key,item])=><div key={key}><dt>{key.replace(/([A-Z])/g," $1")}</dt><dd><ReadableValue value={item}/></dd></div>)}</dl>;
  return null;
}

function SectionCard({ strategyId, section, value, editing, canEdit, expectedRevisionNumber, editButtonRef, onEdit, onCancel, onSaved }: {
  strategyId:string;section:ReviewSectionKey;value:unknown;editing:boolean;canEdit:boolean;expectedRevisionNumber:number;
  editButtonRef:(node:HTMLButtonElement|null)=>void;onEdit:()=>void;onCancel:()=>void;onSaved:()=>void;
}) {
  const [state, action, pending] = useActionState(saveStrategySection, initialState);
  useEffect(()=>{if(state.success)onSaved();},[state.success,onSaved]);
  const text = plainSections.has(section) ? String(value ?? "") : JSON.stringify(value,null,2);
  return <section className={styles.section} aria-labelledby={`heading-${section}`}>
    <div className={styles.sectionHeading}><h2 id={`heading-${section}`}>{labels[section]}</h2>{canEdit&&!editing&&<button aria-label={"Edit "+labels[section]} ref={editButtonRef} type="button" onClick={onEdit}>Edit</button>}</div>
    {editing?<form action={action} className={styles.editor}>
      <input name="strategyId" type="hidden" value={strategyId}/><input name="section" type="hidden" value={section}/><input name="expectedRevisionNumber" type="hidden" value={expectedRevisionNumber}/>
      <label htmlFor={`content-${section}`}>{plainSections.has(section)?"Section content":"Structured section content (JSON)"}</label>
      <textarea autoFocus defaultValue={text} id={`content-${section}`} name="content" rows={plainSections.has(section)?6:14} required/>
      {state.error&&<p role="alert">{state.error.message}</p>}
      <div><button className="strategy-primary" disabled={pending} type="submit">{pending?"Saving...":"Save"}</button><button className="strategy-secondary" disabled={pending} onClick={onCancel} type="button">Cancel</button></div>
    </form>:<ReadableValue value={value}/>}
  </section>;
}

function StatusActions({ strategy }: { strategy: StrategyReview }) {
  const [state, action, pending] = useActionState(changeStrategyStatus, initialState);
  if(strategy.status==="archived") return <p className={styles.archivedNote}>This strategy is archived and remains available for reference.</p>;
  const draft = strategy.status==="generated"||strategy.status==="edited";
  return <form action={action} className={styles.statusActions}>
    <input name="strategyId" type="hidden" value={strategy.id}/>
    {draft&&<><button className="strategy-primary" disabled={pending} name="status" value="accepted">Accept Strategy</button>
    <label>Optional rejection reason<input maxLength={500} name="reason"/></label>
    <button className="strategy-secondary" disabled={pending} name="status" value="rejected">Reject Strategy</button></>}
    <button className="strategy-secondary" disabled={pending} name="status" value="archived">Archive</button>
    {state.error&&<p role="alert">{state.error.message}</p>}
    {state.success&&<p role="status">Strategy status updated.</p>}
  </form>;
}

export function StrategyReviewWorkspace({ strategy, editorName }: { strategy:StrategyReview;editorName:string }) {
  const [editing,setEditing]=useState<ReviewSectionKey|null>(null);
  const editButtons=useRef<Partial<Record<ReviewSectionKey,HTMLButtonElement>>>({});
  const finishEditing=(section:ReviewSectionKey)=>{setEditing(null);requestAnimationFrame(()=>editButtons.current[section]?.focus());};
  const historical=strategy.selectedRevision!==null;
  return <div className={styles.workspace}>
    <header className={styles.hero}>
      <div><Link href="/strategy">Back to strategy history</Link><span>Strategy V{strategy.version} - {strategy.status}</span><h1>{strategy.title}</h1><p>Generated {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium"}).format(new Date(strategy.createdAt))} - Prompt v{strategy.promptVersion}</p></div>
      <div className={styles.exportActions}><button onClick={()=>window.print()} type="button">Print</button><a href={`/strategy/${strategy.id}/pdf${historical?`?revision=${strategy.selectedRevision}`:""}`}>Export PDF</a></div>
    </header>
    {historical&&<div className={styles.historyNotice}>Viewing Revision {strategy.selectedRevision}. <Link href={`/strategy/${strategy.id}`}>Return to current version</Link></div>}
    {!historical&&<><StatusActions strategy={strategy}/><form action={regenerateMarketingStrategy} className={styles.regenerate}><input name="strategyId" type="hidden" value={strategy.id}/><button className="strategy-secondary" type="submit">Regenerate Strategy</button></form></>}
    {strategy.reviewReason&&<p className={styles.reason}>Review reason: {strategy.reviewReason}</p>}
    <div className={styles.sections}>{(Object.keys(strategy.document) as ReviewSectionKey[]).map(section=><SectionCard key={section} strategyId={strategy.id} section={section} value={strategy.document[section]} editing={editing===section} canEdit={!historical&&["generated","edited"].includes(strategy.status)} expectedRevisionNumber={strategy.latestRevisionNumber} editButtonRef={(node)=>{if(node)editButtons.current[section]=node;}} onEdit={()=>setEditing(section)} onCancel={()=>finishEditing(section)} onSaved={()=>finishEditing(section)}/>)}</div>
    <details className={styles.original}><summary>View unchanged AI original analysis</summary><StrategyView strategy={strategy.originalContent}/></details>
    <aside className={styles.revisions}><h2>Revision History</h2><Link href={"/strategy/"+strategy.id+"?revision=0"}>AI Original</Link>{strategy.revisions.length?strategy.revisions.map(revision=><Link href={"/strategy/"+strategy.id+"?revision="+revision.revisionNumber+"&revisionPage="+strategy.revisionPage} key={revision.id}><strong>Revision {revision.revisionNumber}</strong><span>{labels[revision.editedSection]} - {editorName} - {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(revision.createdAt))}</span></Link>):<p>No edits yet. The AI original is the current version.</p>}{strategy.revisionPageCount>1&&<nav aria-label="Revision history pages" className={styles.pagination}>{strategy.revisionPage>1&&<Link href={"/strategy/"+strategy.id+"?revisionPage="+(strategy.revisionPage-1)}>Previous</Link>}<span>Page {strategy.revisionPage} of {strategy.revisionPageCount}</span>{strategy.revisionPage<strategy.revisionPageCount&&<Link href={"/strategy/"+strategy.id+"?revisionPage="+(strategy.revisionPage+1)}>Next</Link>}</nav>}</aside>
  </div>;
}