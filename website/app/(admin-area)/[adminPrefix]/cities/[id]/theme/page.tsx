"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import {
  StepIndicator,
  StepColor,
  StepTypography,
  StepMotifs,
  StepPhoto,
  DEFAULT_WIZARD,
  type WizardState,
} from "./_components";

const TOTAL_STEPS = 4;

export default function ThemeWizardPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hydrate from existing theme
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.getCityTheme(cityId);
        if (res.data) {
          const d = res.data;
          setState((prev) => ({
            ...prev,
            primary: d.colorPrimary ?? prev.primary,
            accent: d.colorAccent ?? prev.accent,
            surface: d.colorBackground ?? prev.surface,
            ink: d.colorText ?? prev.ink,
            muted: d.colorSecondary ?? prev.muted,
            fontDisplay: stripFontFamily(d.displayFontFamily) || prev.fontDisplay,
            fontBody: stripFontFamily(d.bodyFontFamily) || prev.fontBody,
            heroImageUrl: d.logoUrl ?? prev.heroImageUrl,
            photoFilter: d.iconPack === "default" ? prev.photoFilter : d.iconPack ?? prev.photoFilter,
            motifDescription: d.emblemUrl ?? prev.motifDescription,
          }));
        }
      } catch {
        // No theme yet -- use defaults
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [cityId]);

  const handleChange = (patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: Record<string, unknown> = {
        themePresetId: "custom",
        colorPrimary: state.primary,
        colorSecondary: state.muted,
        colorAccent: state.accent,
        colorBackground: state.surface,
        colorText: state.ink,
        displayFontFamily: `'${state.fontDisplay}', serif`,
        bodyFontFamily: `'${state.fontBody}', sans-serif`,
        logoUrl: state.heroImageUrl,
        emblemUrl: state.motifDescription,
        iconPack: state.photoFilter,
      };

      await apiClient.upsertCityTheme(cityId, payload);
      setSuccess("Theme saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">
          Cities
        </Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">
          City
        </Link>
        <ChevronRight />
        <span className="text-gray-200">Theme</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Theme Builder</h1>
        <StepIndicator current={step} />
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-400">
          {success}
        </div>
      )}

      {/* Step content */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
        <h2 className="text-sm font-medium text-gray-200 mb-3">
          {step === 0 && "Color Palette"}
          {step === 1 && "Typography"}
          {step === 2 && "Motifs"}
          {step === 3 && "Photography"}
        </h2>

        {step === 0 && <StepColor state={state} onChange={handleChange} />}
        {step === 1 && <StepTypography state={state} onChange={handleChange} />}
        {step === 2 && <StepMotifs state={state} onChange={handleChange} />}
        {step === 3 && <StepPhoto state={state} onChange={handleChange} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-8 px-3 inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
              className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-4 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Theme"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Strip wrapping quotes and generic fallback from a CSS font-family string. */
function stripFontFamily(val: string | undefined): string {
  if (!val) return "";
  return val.replace(/['"]/g, "").replace(/,\s*(serif|sans-serif|cursive|monospace)$/i, "").trim();
}

function ChevronRight() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
