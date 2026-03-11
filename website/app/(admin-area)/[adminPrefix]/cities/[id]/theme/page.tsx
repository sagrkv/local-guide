"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { listPresetIds, getThemePreset } from "@/lib/cultural-theme";

interface ThemeData {
  themePresetId: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorText: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  logoUrl: string;
  emblemUrl: string;
  backgroundPatternUrl: string;
  mapTileUrl: string;
  iconPack: string;
}

const DEFAULT_THEME: ThemeData = {
  themePresetId: "default",
  colorPrimary: "#1a1a2e",
  colorSecondary: "#16213e",
  colorAccent: "#e94560",
  colorBackground: "#0f0f23",
  colorText: "#f5f5f5",
  displayFontFamily: "",
  bodyFontFamily: "",
  logoUrl: "",
  emblemUrl: "",
  backgroundPatternUrl: "",
  mapTileUrl: "",
  iconPack: "default",
};

const PRESET_IDS = listPresetIds();

export default function ThemeEditorPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [theme, setTheme] = useState<ThemeData>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPreset = useMemo(
    () => getThemePreset(theme.themePresetId),
    [theme.themePresetId],
  );

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await apiClient.getCityTheme(cityId);
        if (res.data) {
          setTheme({
            themePresetId: res.data.themePresetId ?? "default",
            colorPrimary: res.data.colorPrimary ?? DEFAULT_THEME.colorPrimary,
            colorSecondary: res.data.colorSecondary ?? DEFAULT_THEME.colorSecondary,
            colorAccent: res.data.colorAccent ?? DEFAULT_THEME.colorAccent,
            colorBackground: res.data.colorBackground ?? DEFAULT_THEME.colorBackground,
            colorText: res.data.colorText ?? DEFAULT_THEME.colorText,
            displayFontFamily: res.data.displayFontFamily ?? "",
            bodyFontFamily: res.data.bodyFontFamily ?? "",
            logoUrl: res.data.logoUrl ?? "",
            emblemUrl: res.data.emblemUrl ?? "",
            backgroundPatternUrl: res.data.backgroundPatternUrl ?? "",
            mapTileUrl: res.data.mapTileUrl ?? "",
            iconPack: res.data.iconPack ?? "default",
          });
        }
      } catch {
        // No theme yet - use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  }, [cityId]);

  const handleChange = (field: keyof ThemeData, value: string) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  };

  const handlePresetChange = (presetId: string) => {
    const preset = getThemePreset(presetId);
    setTheme((prev) => ({
      ...prev,
      themePresetId: presetId,
      colorPrimary: preset.palette.primary,
      colorSecondary: preset.palette.secondary,
      colorAccent: preset.palette.accent,
      colorBackground: preset.palette.background,
      colorText: preset.palette.text,
      displayFontFamily: `'${preset.fonts.display}', serif`,
      bodyFontFamily: `'${preset.fonts.body}', sans-serif`,
    }));
    setSuccess("");
  };

  const handleResetToPreset = () => {
    handlePresetChange(theme.themePresetId);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: Record<string, unknown> = { themePresetId: theme.themePresetId };
      for (const [key, value] of Object.entries(theme)) {
        if (value) payload[key] = value;
      }

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
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <span className="text-gray-200">Theme</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Theme Editor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToPreset}
            className="h-8 px-3 inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] font-medium transition-colors"
          >
            Reset to Preset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-400">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        {/* Form */}
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800/50">
            {/* Base Preset */}
            <div className="p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-200">Base Preset</h2>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Theme Preset</label>
                  <select
                    value={theme.themePresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="h-8 w-[200px] rounded-md border border-gray-700 bg-gray-950 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
                  >
                    {PRESET_IDS.map((id) => {
                      const p = getThemePreset(id);
                      return (
                        <option key={id} value={id}>{p.name}</option>
                      );
                    })}
                  </select>
                </div>
                {/* Preset color swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Preset colors:</span>
                  {[
                    selectedPreset.palette.primary,
                    selectedPreset.palette.secondary,
                    selectedPreset.palette.accent,
                    selectedPreset.palette.background,
                    selectedPreset.palette.text,
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <span className="text-[11px] text-gray-500 ml-1">
                    {selectedPreset.fonts.display} / {selectedPreset.fonts.body}
                  </span>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-200">Color Overrides</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(
                  [
                    ["colorPrimary", "Primary"],
                    ["colorSecondary", "Secondary"],
                    ["colorAccent", "Accent"],
                    ["colorBackground", "Background"],
                    ["colorText", "Text"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className="h-8 w-10 rounded border border-gray-700 bg-transparent cursor-pointer"
                      />
                      <input
                        value={theme[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-200">Font Overrides</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Display Font</label>
                  <input
                    value={theme.displayFontFamily}
                    onChange={(e) => handleChange("displayFontFamily", e.target.value)}
                    className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                    placeholder="Playfair Display"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Body Font</label>
                  <input
                    value={theme.bodyFontFamily}
                    onChange={(e) => handleChange("bodyFontFamily", e.target.value)}
                    className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                    placeholder="Inter"
                  />
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-200">Assets</h2>
              {(
                [
                  ["logoUrl", "Logo URL"],
                  ["emblemUrl", "Emblem URL"],
                  ["backgroundPatternUrl", "Background Pattern URL"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">{label}</label>
                  <input
                    value={theme[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-200">Map</h2>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Tile URL</label>
                <input
                  value={theme.mapTileUrl}
                  onChange={(e) => handleChange("mapTileUrl", e.target.value)}
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                  placeholder="https://tiles.example.com/{z}/{x}/{y}.png"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Icon Pack</label>
                <select
                  value={theme.iconPack}
                  onChange={(e) => handleChange("iconPack", e.target.value)}
                  className="h-8 w-[160px] rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="default">Default</option>
                  <option value="vintage">Vintage</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 sticky top-4">
            <h2 className="text-sm font-medium text-gray-200 mb-3">Preview</h2>
            <div
              className="rounded-lg p-4 space-y-3"
              style={{
                backgroundColor: theme.colorBackground,
                color: theme.colorText,
                fontFamily: theme.bodyFontFamily || "inherit",
              }}
            >
              <h3
                className="text-lg font-semibold"
                style={{
                  color: theme.colorPrimary,
                  fontFamily: theme.displayFontFamily || "inherit",
                }}
              >
                Sample Place
              </h3>
              <p className="text-sm" style={{ color: theme.colorText }}>
                A beautiful spot worth visiting in this city. Great views and wonderful atmosphere.
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: theme.colorAccent,
                    color: theme.colorBackground,
                  }}
                >
                  Must Visit
                </span>
                <span
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: theme.colorSecondary,
                    color: theme.colorText,
                  }}
                >
                  Heritage
                </span>
              </div>
              <button
                className="w-full py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme.colorAccent,
                  color: theme.colorBackground,
                }}
              >
                View Details
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Preset: {selectedPreset.name} — Motifs: {selectedPreset.motifs.name}, Border: {selectedPreset.motifs.borderStyle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
