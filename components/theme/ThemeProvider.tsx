"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";

type Appearance = "light" | "medium" | "dark";
type PresetName = "indigo" | "blue" | "cyan" | "emerald" | "violet" | "rose" | "amber" | "slate" | "custom";
type ThemeSelection = { appearance: Appearance; preset: PresetName; customColor: string };
const STORAGE_KEY = "digisprint-theme-v1";
const DEFAULT_THEME: ThemeSelection = { appearance: "dark", preset: "indigo", customColor: "#6366F1" };
const PRESETS = {
  indigo: { label: "Indigo", color: "#6366F1" }, blue: { label: "Blue", color: "#2563EB" }, cyan: { label: "Cyan", color: "#0891B2" }, emerald: { label: "Emerald", color: "#059669" }, violet: { label: "Violet", color: "#7C3AED" }, rose: { label: "Rose", color: "#E11D48" }, amber: { label: "Amber", color: "#D97706" }, slate: { label: "Slate", color: "#475569" },
} as const;
function rgb(hex: string) { const n = Number.parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex(values: number[]) { return `#${values.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`; }
function mix(color: string, amount: number, target = 0) { return hex(rgb(color).map((value) => value + (target - value) * amount)); }
function luminance(color: string) { const c = rgb(color).map((v) => { const x = v / 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; }
function accentColor(theme: ThemeSelection) { return theme.preset === "custom" ? theme.customColor : PRESETS[theme.preset].color; }
function applyTheme(theme: ThemeSelection) {
  const root = document.documentElement; const color = accentColor(theme); const [r, g, b] = rgb(color); const bright = luminance(color) > .42;
  root.dataset.appearance = theme.appearance; root.dataset.accent = theme.preset; root.style.colorScheme = theme.appearance === "light" ? "light" : "dark";
  root.style.setProperty("--color-accent", color); root.style.setProperty("--color-accent-hover", mix(color, bright ? .2 : .12));
  root.style.setProperty("--color-accent-soft", `rgba(${r},${g},${b},${theme.appearance === "light" ? ".10" : ".14"})`);
  root.style.setProperty("--color-accent-border", `rgba(${r},${g},${b},${theme.appearance === "light" ? ".32" : ".42"})`);
  root.style.setProperty("--color-accent-text", theme.appearance === "light" ? mix(color, bright ? .42 : .16) : mix(color, bright ? .05 : .22, 255));
  root.style.setProperty("--color-accent-focus", `rgba(${r},${g},${b},.42)`); root.style.setProperty("--color-accent-contrast", bright ? "#09090B" : "#FFFFFF");
}
type ThemeContextValue = { selection: ThemeSelection; preview: (value: ThemeSelection) => void; save: (value: ThemeSelection) => void; reset: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState(DEFAULT_THEME);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const theme: ThemeSelection = saved ? JSON.parse(saved) as ThemeSelection : { ...DEFAULT_THEME, appearance: matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark" };
        setSelection(theme); applyTheme(theme);
      } catch { applyTheme(DEFAULT_THEME); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const preview = useCallback((value: ThemeSelection) => { setSelection(value); applyTheme(value); }, []);
  const save = useCallback((value: ThemeSelection) => { setSelection(value); applyTheme(value); localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }, []);
  const reset = useCallback(() => { setSelection(DEFAULT_THEME); applyTheme(DEFAULT_THEME); localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME)); }, []);
  const value = useMemo(() => ({ selection, preview, save, reset }), [selection, preview, save, reset]); return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error("ThemeSettings requires ThemeProvider"); return context; }
export function ThemeSettings() {
  const { selection, preview, save, reset } = useTheme(); const [open, setOpen] = useState(false); const titleId = useId();
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [open]);
  const update = (next: Partial<ThemeSelection>) => preview({ ...selection, ...next });
  return <div className="theme-settings"><button className="theme-trigger" type="button" aria-label={`Open theme settings. Current appearance: ${selection.appearance}`} aria-expanded={open} onClick={() => setOpen(true)}><span aria-hidden="true">◐</span><span className="theme-trigger-label">Theme</span></button>{open && <div className="theme-layer"><button className="theme-backdrop" type="button" aria-label="Close theme settings" onClick={() => setOpen(false)} /><section className="theme-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <div className="theme-panel-header"><div><span>Personalise DigiSprint</span><h2 id={titleId}>Theme settings</h2></div><button type="button" aria-label="Close theme settings" onClick={() => setOpen(false)}>×</button></div>
    <fieldset className="theme-fieldset"><legend>Appearance</legend><div className="appearance-options" role="radiogroup" aria-label="Appearance mode">{(["light", "medium", "dark"] as Appearance[]).map((appearance) => <button key={appearance} type="button" role="radio" aria-checked={selection.appearance === appearance} onClick={() => update({ appearance })}><span className={`appearance-preview appearance-preview-${appearance}`} aria-hidden="true" /><span>{appearance[0].toUpperCase() + appearance.slice(1)}</span>{selection.appearance === appearance && <b aria-hidden="true">✓</b>}</button>)}</div></fieldset>
    <fieldset className="theme-fieldset"><legend>Accent colour</legend><div className="accent-swatches">{Object.entries(PRESETS).map(([name, preset]) => <button key={name} type="button" aria-label={`${preset.label} accent`} aria-pressed={selection.preset === name} title={preset.label} style={{ "--swatch-color": preset.color } as React.CSSProperties} onClick={() => update({ preset: name as ThemeSelection["preset"] })}><span aria-hidden="true" /><small>{preset.label}</small>{selection.preset === name && <b aria-hidden="true">✓</b>}</button>)}</div><label className="custom-color"><span>Custom colour</span><span><input type="color" value={selection.customColor} aria-label="Choose a custom accent colour" onChange={(event) => update({ preset: "custom", customColor: event.target.value.toUpperCase() })} /><output>{selection.customColor}</output></span></label></fieldset>
    <div className="theme-live-preview" aria-label="Theme preview"><span>Live preview</span><div><i aria-hidden="true">✓</i><strong>Verified profile</strong><button type="button" tabIndex={-1}>Primary action</button></div></div>
    <div className="theme-actions"><button type="button" className="theme-reset" onClick={reset}>Reset to DigiSprint Default</button><button type="button" className="theme-apply" onClick={() => { save(selection); setOpen(false); }}>Apply</button></div><p className="sr-only" aria-live="polite">{selection.appearance} appearance with {selection.preset} accent selected.</p>
  </section></div>}</div>;
}
