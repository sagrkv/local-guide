"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

const TIME_OF_DAY = ["EARLY_MORNING", "MORNING", "AFTERNOON", "EVENING", "NIGHT", "ANY_TIME"];

export default function ItineraryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;
  const itinId = params.itinId as string;

  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    difficulty: "",
    estimatedBudget: "",
    coverImageUrl: "",
    status: "DRAFT",
  });

  // Add stop
  const [poiSearch, setPoiSearch] = useState("");
  const [poiResults, setPoiResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getItinerary(itinId);
      const itin = res.data;
      setItinerary(itin);
      setForm({
        title: itin.title ?? "",
        description: itin.description ?? "",
        duration: itin.duration ?? "",
        difficulty: itin.difficulty ?? "",
        estimatedBudget: itin.estimatedBudget ?? "",
        coverImageUrl: itin.coverImageUrl ?? "",
        status: itin.status ?? "DRAFT",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  }, [itinId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await apiClient.updateItinerary(itinId, {
        title: form.title,
        description: form.description || undefined,
        duration: form.duration,
        difficulty: form.difficulty || undefined,
        estimatedBudget: form.estimatedBudget || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        status: form.status,
      });
      setSuccess("Itinerary saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSearchPOIs = async () => {
    if (!poiSearch.trim()) return;
    try {
      setSearching(true);
      const res = await apiClient.getCityPOIs(cityId, { search: poiSearch, limit: 10 });
      setPoiResults(res.data ?? []);
    } catch {
      // Ignore search errors
    } finally {
      setSearching(false);
    }
  };

  const handleAddStop = async (poiId: string) => {
    try {
      setError("");
      const order = (itinerary?.stops?.length ?? 0) + 1;
      await apiClient.addItineraryStop(itinId, { poiId, order });
      setPoiSearch("");
      setPoiResults([]);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stop");
    }
  };

  const handleRemoveStop = async (stopId: string) => {
    try {
      setError("");
      await apiClient.removeItineraryStop(stopId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove stop");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const inputCls = "h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none";
  const labelCls = "text-xs font-medium text-gray-400";

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}/itineraries`} className="text-gray-400 hover:text-white">Itineraries</Link>
        <ChevronRight />
        <span className="text-gray-200">{form.title || "Edit"}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Itinerary</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-400">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        {/* Form */}
        <div className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800/50">
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">Details</h2>
            <div className="space-y-1">
              <label className={labelCls}>Title</label>
              <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none resize-y min-h-[80px]"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Duration</label>
                <input value={form.duration} onChange={(e) => handleChange("duration", e.target.value)} className={inputCls} placeholder="Half day" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Difficulty</label>
                <input value={form.difficulty} onChange={(e) => handleChange("difficulty", e.target.value)} className={inputCls} placeholder="Easy" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Budget</label>
                <input value={form.estimatedBudget} onChange={(e) => handleChange("estimatedBudget", e.target.value)} className={inputCls} placeholder="500 INR" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Cover Image URL</label>
                <input value={form.coverImageUrl} onChange={(e) => handleChange("coverImageUrl", e.target.value)} className={inputCls} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">
              Stops ({itinerary?.stops?.length ?? 0})
            </h2>

            {/* Stop cards */}
            <div className="space-y-2">
              {(itinerary?.stops ?? [])
                .sort((a: any, b: any) => a.order - b.order)
                .map((stop: any, idx: number) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-2 p-2 border border-gray-800/50 rounded-md"
                  >
                    <span className="h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center text-[11px] text-gray-400 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-200 truncate">
                        {stop.poi?.name ?? "Unknown POI"}
                      </p>
                      {stop.timeOfDay && (
                        <p className="text-xs text-gray-500">{stop.timeOfDay.replace(/_/g, " ")}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveStop(stop.id)}
                      className="h-6 px-1.5 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>

            {/* Add Stop */}
            <div className="border-t border-gray-800/50 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-400">Add Stop</p>
              <div className="flex items-center gap-2">
                <input
                  value={poiSearch}
                  onChange={(e) => setPoiSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchPOIs()}
                  className={`${inputCls} flex-1`}
                  placeholder="Search POI by name..."
                />
                <button
                  onClick={handleSearchPOIs}
                  disabled={searching}
                  className="h-8 px-3 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors disabled:opacity-50 shrink-0"
                >
                  Search
                </button>
              </div>
              {poiResults.length > 0 && (
                <div className="space-y-1">
                  {poiResults.map((poi: any) => (
                    <div
                      key={poi.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/30 transition-colors"
                    >
                      <span className="text-[13px] text-gray-300 truncate">{poi.name}</span>
                      <button
                        onClick={() => handleAddStop(poi.id)}
                        className="h-6 px-2 rounded text-[11px] font-medium bg-white/10 text-gray-200 hover:bg-white/20 transition-colors shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
