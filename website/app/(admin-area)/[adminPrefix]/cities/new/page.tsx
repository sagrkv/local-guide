"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";

// Lazy-load the map step (maplibre-gl is heavy)
const LocationStep = dynamic(() => import("./LocationStep"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[320px] border border-gray-800 rounded-lg">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
    </div>
  ),
});

const STEPS = ["Basics", "Location", "Theme", "Confirm"] as const;
type Step = 0 | 1 | 2 | 3;
const COUNTRIES = ["India", "Sri Lanka", "Nepal", "Thailand", "Indonesia", "Japan", "Other"];

type Colors = { primary: string; accent: string; surface: string; ink: string; muted: string };
const PALETTE_PRESETS: { id: string; label: string; desc: string; colors: Colors }[] = [
  { id: "coastal", label: "Coastal", desc: "Ocean blues & sandy warmth", colors: { primary: "#0F766E", accent: "#F97316", surface: "#F0FDFA", ink: "#1E3A5F", muted: "#94A3B8" } },
  { id: "mountain", label: "Mountain", desc: "Deep greens & stone gray", colors: { primary: "#365314", accent: "#A3E635", surface: "#F7FEE7", ink: "#1A2E05", muted: "#84CC16" } },
  { id: "heritage", label: "Heritage", desc: "Royal gold & aged paper", colors: { primary: "#8B6914", accent: "#D4A574", surface: "#FFF8F0", ink: "#3E2723", muted: "#BFA98A" } },
  { id: "rose", label: "Rose", desc: "Pink city warmth", colors: { primary: "#C2185B", accent: "#F59E0B", surface: "#FFF1F2", ink: "#4A1A2E", muted: "#C9A0A0" } },
  { id: "custom", label: "Custom", desc: "Start from defaults", colors: { primary: "#1E3A5F", accent: "#D4A574", surface: "#FAFAF8", ink: "#1A1A1A", muted: "#9CA3AF" } },
];

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const citySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  tagline: z.string().min(1, "Tagline is required").max(500),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  defaultZoom: z.number().int().min(12).max(16),
});

export default function CityCreateWizard() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [country, setCountry] = useState("India");
  const [region, setRegion] = useState("");
  const [tagline, setTagline] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [zoom, setZoom] = useState(14);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [themeSkipped, setThemeSkipped] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const slug = slugOverride || slugify(name);
  const chosenPalette = PALETTE_PRESETS.find((p) => p.id === selectedPalette);

  const handleLatLngChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!name.trim()) errs.name = "Name is required";
      if (!tagline.trim()) errs.tagline = "Tagline is required";
    }
    if (s === 1) {
      if (lat === null || lng === null) errs.location = "Click the map to set a city center";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0) as Step);

  const handleCreate = async () => {
    setApiError("");
    const parsed = citySchema.safeParse({
      name: name.trim(),
      tagline: tagline.trim(),
      state: region.trim() || undefined,
      country: country || undefined,
      centerLat: lat,
      centerLng: lng,
      defaultZoom: zoom,
    });

    if (!parsed.success) {
      setApiError("Validation failed. Please go back and fix errors.");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.createCity({
        ...parsed.data,
        slug,
        status: "DRAFT",
      });
      const cityId = res.data?.id;

      // If a palette was chosen, save theme
      if (chosenPalette && !themeSkipped && cityId) {
        try {
          await apiClient.upsertCityTheme(cityId, {
            colorPrimary: chosenPalette.colors.primary,
            colorAccent: chosenPalette.colors.accent,
            colorBackground: chosenPalette.colors.surface,
            colorText: chosenPalette.colors.ink,
            colorSecondary: chosenPalette.colors.muted,
          });
        } catch {
          // Theme save failure is non-critical
        }
      }

      router.push(`/${adminPrefix}/cities/${cityId}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create city");
    } finally {
      setSaving(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center gap-1 mb-4">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <div className="w-6 h-px bg-gray-800" />}
            <button
              onClick={() => done && setStep(i as Step)}
              disabled={i > step}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${active ? "bg-white/10 text-white" : done ? "text-gray-400 hover:text-gray-200 cursor-pointer" : "text-gray-600 cursor-not-allowed"}`}
            >
              <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-white/20 text-white" : "bg-gray-800 text-gray-600"}`}>
                {done ? "\u2713" : i + 1}
              </span>
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">
          Cities
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-gray-200">New City</span>
      </nav>

      <h1 className="text-xl font-semibold">Create City</h1>

      {stepIndicator}

      {apiError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {apiError}
        </div>
      )}

      <div className="border border-gray-800 rounded-lg bg-gray-900">
        {/* Step 1: Basics */}
        {step === 0 && (
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">The Basics</h2>
            <FieldRow label="City name" required error={errors.name}>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
                className={inputClass}
                placeholder="e.g. Jaipur"
              />
            </FieldRow>
            <FieldRow label="Slug">
              <div className="flex items-center gap-2">
                <input
                  value={slugOverride || slugify(name)}
                  onChange={(e) => setSlugOverride(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className={inputClass}
                  placeholder="auto-generated"
                />
                {slugOverride && (
                  <button
                    onClick={() => setSlugOverride("")}
                    className="text-[11px] text-gray-500 hover:text-gray-300 shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Country">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Region / State">
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Rajasthan"
                />
              </FieldRow>
            </div>
            <FieldRow label="Tagline" required error={errors.tagline} hint="The one sentence that captures the soul">
              <input
                value={tagline}
                onChange={(e) => { setTagline(e.target.value); setErrors((p) => { const n = { ...p }; delete n.tagline; return n; }); }}
                className={inputClass}
                placeholder="e.g. The Pink City"
              />
            </FieldRow>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 1 && (
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">Location</h2>
            {errors.location && (
              <p className="text-red-400 text-xs">{errors.location}</p>
            )}
            <LocationStep
              lat={lat}
              lng={lng}
              zoom={zoom}
              onLatLngChange={handleLatLngChange}
              onZoomChange={handleZoomChange}
            />
          </div>
        )}

        {/* Step 3: Quick Theme */}
        {step === 2 && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-200">Quick Theme</h2>
              <button
                onClick={() => { setThemeSkipped(true); setSelectedPalette(null); goNext(); }}
                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip -- I&apos;ll set up the theme later
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Pick a starter palette. You can customize everything later in the Theme Editor.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => { setSelectedPalette(preset.id); setThemeSkipped(false); }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedPalette === preset.id
                      ? "border-white/30 bg-white/5"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-2">
                    {Object.values(preset.colors).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-gray-700"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="text-[13px] font-medium text-gray-200">
                    {preset.label}
                  </div>
                  <div className="text-[11px] text-gray-500">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 3 && (
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">Confirm &amp; Create</h2>
            <div className="border border-gray-800 rounded-lg bg-gray-950 divide-y divide-gray-800/50">
              <SummaryRow label="Name" value={name} />
              <SummaryRow label="Slug" value={slug} />
              <SummaryRow label="Country" value={country} />
              {region && <SummaryRow label="Region" value={region} />}
              <SummaryRow label="Tagline" value={tagline} />
              <SummaryRow
                label="Center"
                value={lat !== null && lng !== null ? `${lat}, ${lng}` : "--"}
              />
              <SummaryRow label="Zoom" value={String(zoom)} />
              <SummaryRow
                label="Theme"
                value={
                  themeSkipped || !chosenPalette
                    ? "Default theme"
                    : chosenPalette.label
                }
              >
                {chosenPalette && !themeSkipped && (
                  <div className="flex items-center gap-1 mt-1">
                    {Object.values(chosenPalette.colors).map((c, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-gray-700"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </SummaryRow>
              <SummaryRow label="Status" value="DRAFT" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              onClick={goBack}
              className="h-8 px-3 inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${adminPrefix}/cities`}
            className="h-8 px-3 inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors"
          >
            Cancel
          </Link>
          {step < 3 ? (
            <button
              onClick={goNext}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create as DRAFT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass = "h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none";

function FieldRow({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-400">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-600">{hint}</p>}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value, children }: {
  label: string; value: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-3 py-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="text-right">
        <span className="text-[13px] text-gray-200">{value}</span>
        {children}
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
