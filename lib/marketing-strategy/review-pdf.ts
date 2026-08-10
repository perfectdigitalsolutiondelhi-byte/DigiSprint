import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { StrategyReview } from "./review-queries";
import type { ReviewSectionKey } from "./review-schema";

const labels: Record<ReviewSectionKey, string> = {
  businessSummary:"Business Summary",objective:"Objective",language:"Language",specialFocus:"Special Focus",
  executiveSummary:"Executive Summary",swot:"SWOT",targetAudience:"Target Audience",positioning:"Positioning",
  marketingChannels:"Marketing Channels",weeklyPlan:"Weekly Plan",calendar:"30-Day Calendar",budget:"Budget",kpis:"KPIs",checklist:"Checklist",
};

function humanize(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase()); }
function linesFromValue(value: unknown, depth = 0): string[] {
  const prefix = "  ".repeat(depth);
  if (value === null || value === undefined || value === "") return [`${prefix}Not specified.`];
  if (typeof value === "string" || typeof value === "number") return String(value).split(/\r?\n/).map((line) => `${prefix}${line}`);
  if (Array.isArray(value)) return value.flatMap((item) => linesFromValue(item, depth + 1).map((line, index) => `${prefix}${index === 0 ? "- " : "  "}${line.trimStart()}`));
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).flatMap(([key,item]) => [`${prefix}${humanize(key)}:`, ...linesFromValue(item, depth + 1)]);
  return [];
}
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width || !current) current = candidate;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildStrategyPdf(strategy: StrategyReview) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const fontBytes = await readFile(path.join(process.cwd(), "assets", "fonts", "NotoSansDevanagari-Regular.ttf"));
  const font = await document.embedFont(fontBytes, { subset: true });
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 52; const contentWidth = pageSize[0] - margin * 2; let page: PDFPage; let y = 0;
  const addPage = () => { page = document.addPage(pageSize); y = pageSize[1] - margin; return page; };
  const ensure = (height: number) => { if (y - height < margin + 24) addPage(); };
  const drawLine = (text: string, size = 10, color = rgb(0.18,0.2,0.25), indent = 0) => {
    for (const line of wrap(text, font, size, contentWidth - indent)) {
      ensure(size + 6); page.drawText(line, { x: margin + indent, y, size, font, color }); y -= size + 6;
    }
  };
  addPage();
  drawLine("DIGISPRINT STRATEGY REVIEW", 9, rgb(0.25,0.35,0.8));
  y -= 8; drawLine(strategy.title, 22, rgb(0.06,0.08,0.14)); y -= 4;
  drawLine(`Strategy V${strategy.version} | Status: ${strategy.status} | Prompt v${strategy.promptVersion}`, 9);
  drawLine(`Generated: ${new Date(strategy.createdAt).toLocaleDateString("en-IN")} | Revision: ${strategy.selectedRevision ?? strategy.latestRevisionNumber}`, 9);
  y -= 16;
  for (const [section,value] of Object.entries(strategy.document) as [ReviewSectionKey,unknown][]) {
    ensure(50); drawLine(labels[section], 15, rgb(0.08,0.13,0.28)); y -= 4;
    for (const line of linesFromValue(value)) drawLine(line, 9.5, rgb(0.2,0.22,0.28), Math.min((line.match(/^\s*/)?.[0].length ?? 0) * 2, 24));
    y -= 12;
  }
  const pages = document.getPages();
  pages.forEach((item,index) => item.drawText(`DigiSprint | Page ${index + 1} of ${pages.length}`, { x: margin, y: 24, size: 8, font, color: rgb(0.45,0.47,0.52) }));
  document.setTitle(strategy.title); document.setSubject("DigiSprint Marketing Strategy Review"); document.setCreator("DigiSprint");
  return document.save();
}