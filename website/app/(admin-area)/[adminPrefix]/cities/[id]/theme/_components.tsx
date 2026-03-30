"use client";

import { useEffect } from "react";
import { PHOTO_FILTER_PRESETS } from "@/components/paper/CityPhoto";

// ── Types ─────────────────────────────────────────────────────────────────

export interface WizardState {
  primary: string;
  accent: string;
  surface: string;
  ink: string;
  muted: string;
  fontDisplay: string;
  fontBody: string;
  motifDescription: string;
  heroImageUrl: string;
  photoFilter: string;
}

export const DEFAULT_WIZARD: WizardState = {
  primary: "#1E3A5F", accent: "#D4A574", surface: "#FAFAF8",
  ink: "#1A1A1A", muted: "#9CA3AF",
  fontDisplay: "Fraunces", fontBody: "DM Sans",
  motifDescription: "", heroImageUrl: "", photoFilter: "natural",
};

// ── Palette Presets ───────────────────────────────────────────────────────

const PALETTES = [
  { id: "coastal", label: "\u{1F3D6}\u{FE0F} Coastal", primary: "#0F766E", accent: "#F97316", surface: "#F0FDFA", ink: "#1E3A5F", muted: "#94A3B8" },
  { id: "mountain", label: "\u{1F3D4}\u{FE0F} Mountain", primary: "#365314", accent: "#A16207", surface: "#F7FEE7", ink: "#1C1917", muted: "#78716C" },
  { id: "heritage", label: "\u{1F3DB}\u{FE0F} Heritage", primary: "#8B6914", accent: "#D4A574", surface: "#FFF8F0", ink: "#3E2723", muted: "#BFA98A" },
  { id: "rose", label: "\u{1F338} Rose", primary: "#C2185B", accent: "#F59E0B", surface: "#FFF1F2", ink: "#4A1A2E", muted: "#C9A0A0" },
  { id: "custom", label: "\u{1F3A8} Custom", primary: "#1E3A5F", accent: "#D4A574", surface: "#FAFAF8", ink: "#1A1A1A", muted: "#9CA3AF" },
];

// ── Font Options ──────────────────────────────────────────────────────────

const DISPLAY_FONTS = [
  "Fraunces", "Playfair Display", "Kalam", "Lora", "Cormorant Garamond",
  "Josefin Sans", "Abril Fatface", "Spectral", "Yeseva One", "Crimson Pro",
];
const BODY_FONTS = ["DM Sans", "Inter", "Source Sans 3", "Nunito Sans", "IBM Plex Sans"];

function gFontUrl(f: string) {
  return `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
}

// ── Step Indicator ────────────────────────────────────────────────────────

const STEPS = ["Color", "Type", "Motifs", "Photo"] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <div className={`w-6 h-px ${done ? "bg-emerald-500/40" : "bg-gray-700"}`} />}
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-medium ${done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-white text-gray-900" : "bg-gray-800 text-gray-500"}`}>
                {done ? "\u2713" : i + 1}
              </span>
              <span className={`text-xs font-medium ${active ? "text-gray-200" : done ? "text-gray-400" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Color Palette ─────────────────────────────────────────────────

const COLOR_FIELDS = [["primary", "Primary"], ["accent", "Accent"], ["surface", "Surface"], ["ink", "Ink"], ["muted", "Muted"]] as const;

export function StepColor({ state, onChange }: { state: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Starter Palette</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PALETTES.map((p) => {
              const active = state.primary === p.primary && state.accent === p.accent;
              return (
                <button key={p.id} onClick={() => onChange({ primary: p.primary, accent: p.accent, surface: p.surface, ink: p.ink, muted: p.muted })}
                  className={`p-2 rounded-md border text-left transition-colors ${active ? "border-white/30 bg-gray-800" : "border-gray-700 bg-gray-900 hover:bg-gray-800/50"}`}>
                  <div className="text-[13px] mb-1">{p.label}</div>
                  <div className="flex gap-0.5">
                    {[p.primary, p.accent, p.surface, p.ink, p.muted].map((c, i) => (
                      <div key={i} className="h-3 flex-1 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Fine-Tune</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_FIELDS.map(([field, label]) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-gray-500">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={state[field]} onChange={(e) => onChange({ [field]: e.target.value })}
                    className="h-8 w-10 rounded border border-gray-700 bg-transparent cursor-pointer" />
                  <input value={state[field]} onChange={(e) => onChange({ [field]: e.target.value })}
                    className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none font-mono" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
        <div className="text-xs font-medium text-gray-400 mb-2">Preview</div>
        <MockPoiCard state={state} />
      </div>
    </div>
  );
}

// ── Step 2: Typography ────────────────────────────────────────────────────

export function StepTypography({ state, onChange }: { state: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  useEffect(() => {
    [...DISPLAY_FONTS, ...BODY_FONTS].forEach((f) => {
      const id = `gfont-${f.replace(/ /g, "-")}`;
      if (!document.getElementById(id)) {
        const link = Object.assign(document.createElement("link"), { id, rel: "stylesheet", href: gFontUrl(f) });
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Display Font</label>
          <div className="flex flex-wrap gap-1.5">
            {DISPLAY_FONTS.map((f) => (
              <button key={f} onClick={() => onChange({ fontDisplay: f })}
                className={`px-2 py-1 rounded border text-[13px] transition-colors ${state.fontDisplay === f ? "border-white/30 bg-gray-800 text-gray-100" : "border-gray-700 text-gray-400 hover:bg-gray-800/50"}`}
                style={{ fontFamily: `'${f}', serif` }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Body Font</label>
          <div className="flex flex-wrap gap-1.5">
            {BODY_FONTS.map((f) => (
              <button key={f} onClick={() => onChange({ fontBody: f })}
                className={`px-2 py-1 rounded border text-[13px] transition-colors ${state.fontBody === f ? "border-white/30 bg-gray-800 text-gray-100" : "border-gray-700 text-gray-400 hover:bg-gray-800/50"}`}
                style={{ fontFamily: `'${f}', sans-serif` }}>{f}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
        <div className="text-xs font-medium text-gray-400 mb-2">Preview</div>
        <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: state.surface }}>
          <h3 className="text-lg font-semibold" style={{ fontFamily: `'${state.fontDisplay}', serif`, color: state.primary }}>
            Mysore Palace
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ fontFamily: `'${state.fontBody}', sans-serif`, color: state.ink }}>
            A historical palace and royal residence of the Wadiyar dynasty.
          </p>
          <p className="text-xs" style={{ fontFamily: `'${state.fontBody}', sans-serif`, color: state.muted }}>
            Open 10 AM - 5:30 PM daily
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Motifs ────────────────────────────────────────────────────────

export function StepMotifs({ state, onChange }: { state: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  return (
    <div className="max-w-xl space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-400">City Motif Description</label>
        <input value={state.motifDescription} onChange={(e) => onChange({ motifDescription: e.target.value })}
          placeholder="e.g. Palace, lotus, Nandi bull"
          className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none" />
        <p className="text-[11px] text-gray-500">
          Describe the cultural motifs for this city. SVG motif library coming soon (#115).
        </p>
      </div>
      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2">
        <p className="text-[13px] text-amber-400">
          Motif visuals will appear here once the SVG library is built. Save a text description for now.
        </p>
      </div>
    </div>
  );
}

// ── Step 4: Photography ───────────────────────────────────────────────────

const SAMPLE_IMG = "https://images.unsplash.com/photo-1600100397608-e1f6e26a4365?w=400&h=260&fit=crop";

export function StepPhoto({ state, onChange }: { state: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  const filterKeys = Object.keys(PHOTO_FILTER_PRESETS);
  return (
    <div className="space-y-3">
      <div className="space-y-1 max-w-xl">
        <label className="text-xs font-medium text-gray-400">Hero Image URL</label>
        <input value={state.heroImageUrl} onChange={(e) => onChange({ heroImageUrl: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none" />
        <p className="text-[11px] text-gray-500">Image upload coming soon. Paste a URL for now.</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-400">Photo Filter</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {filterKeys.map((key) => {
            const preset = PHOTO_FILTER_PRESETS[key];
            const active = state.photoFilter === key;
            return (
              <button key={key} onClick={() => onChange({ photoFilter: key })}
                className={`rounded-md border overflow-hidden transition-colors ${active ? "border-white/30 ring-1 ring-white/20" : "border-gray-700 hover:border-gray-600"}`}>
                <div className="aspect-[3/2] bg-gray-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SAMPLE_IMG} alt={preset.label} className="w-full h-full object-cover" style={{ filter: preset.css }} />
                </div>
                <div className="px-1.5 py-1 text-center">
                  <span className={`text-[11px] font-medium ${active ? "text-gray-100" : "text-gray-400"}`}>{preset.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {state.heroImageUrl && (
        <div className="space-y-1 max-w-md">
          <label className="text-xs font-medium text-gray-400">Hero Preview</label>
          <div className="rounded-lg overflow-hidden border border-gray-700 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.heroImageUrl} alt="Hero preview" className="w-full h-full object-cover"
              style={{ filter: PHOTO_FILTER_PRESETS[state.photoFilter]?.css ?? "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mock POI Card ─────────────────────────────────────────────────────────

function MockPoiCard({ state }: { state: WizardState }) {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: state.surface, color: state.ink }}>
      <h3 className="text-base font-semibold" style={{ color: state.primary, fontFamily: `'${state.fontDisplay}', serif` }}>
        Sample Place
      </h3>
      <p className="text-[13px] leading-snug" style={{ color: state.ink, fontFamily: `'${state.fontBody}', sans-serif` }}>
        A beautiful spot worth visiting. Great views and wonderful atmosphere.
      </p>
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: state.accent, color: state.surface }}>
          Must Visit
        </span>
        <span className="px-1.5 py-0.5 rounded text-[11px]" style={{ backgroundColor: state.muted + "22", color: state.ink }}>
          Heritage
        </span>
      </div>
      <button className="w-full py-1.5 rounded-md text-[13px] font-medium" style={{ backgroundColor: state.primary, color: state.surface }}>
        View Details
      </button>
    </div>
  );
}
