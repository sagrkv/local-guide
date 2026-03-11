"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_TO_VISIT = ["EARLY_MORNING", "MORNING", "AFTERNOON", "EVENING", "NIGHT", "ANY_TIME"];
const BEST_SEASON = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "MONSOON", "ALL_YEAR"];
const PRIORITIES = ["MUST_VISIT", "RECOMMENDED", "HIDDEN_GEM", "OPTIONAL"];
const TIME_ESTIMATES = ["15 min", "30 min", "1 hour", "1-2 hours", "2-3 hours", "Half day", "Full day"];

const TABS = ["Basic", "Location", "Tourist", "Contact", "Hours", "Flags", "Content", "Photos", "Status"] as const;
type Tab = (typeof TABS)[number];

export default function POIEditorPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const poiId = params.id as string;

  const [poi, setPoi] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Basic");

  // Form state
  const [form, setForm] = useState<Record<string, any>>({});
  const [hours, setHours] = useState<Record<string, string>>({});

  // Photo form
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [poiRes, catsRes, photosRes] = await Promise.allSettled([
        apiClient.getPOI(poiId),
        apiClient.getCategories({ limit: 100 }),
        apiClient.getPOIPhotos(poiId),
      ]);

      if (poiRes.status === "fulfilled") {
        const p = poiRes.value.data;
        setPoi(p);
        setForm({
          name: p.name ?? "",
          shortDescription: p.shortDescription ?? "",
          longDescription: p.longDescription ?? "",
          categoryId: p.categoryId ?? "",
          subcategory: p.subcategory ?? "",
          priority: p.priority ?? "RECOMMENDED",
          latitude: p.latitude?.toString() ?? "",
          longitude: p.longitude?.toString() ?? "",
          address: p.address ?? "",
          directionsNote: p.directionsNote ?? "",
          nearestLandmark: p.nearestLandmark ?? "",
          estimatedTimeToSpend: p.estimatedTimeToSpend ?? "",
          bestTimeToVisit: p.bestTimeToVisit ?? "",
          bestSeason: p.bestSeason ?? "",
          entryFee: p.entryFee ?? "",
          dressCode: p.dressCode ?? "",
          phone: p.phone ?? "",
          website: p.website ?? "",
          instagram: p.instagram ?? "",
          parkingAvailable: p.parkingAvailable ?? false,
          wheelchairAccessible: p.wheelchairAccessible ?? false,
          petFriendly: p.petFriendly ?? false,
          wifiAvailable: p.wifiAvailable ?? false,
          familyFriendly: p.familyFriendly ?? false,
          budgetFriendly: p.budgetFriendly ?? false,
          localTip: p.localTip ?? "",
          warningNote: p.warningNote ?? "",
        });
        // Parse opening hours
        const oh = p.openingHours ?? {};
        const parsed: Record<string, string> = {};
        for (const day of DAYS) {
          parsed[day] = typeof oh === "object" && oh !== null ? (oh[day] ?? "") : "";
        }
        setHours(parsed);
      }

      if (catsRes.status === "fulfilled") {
        setCategories(catsRes.value.data ?? []);
      }

      if (photosRes.status === "fulfilled") {
        setPhotos(photosRes.value.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load POI");
    } finally {
      setLoading(false);
    }
  }, [poiId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: Record<string, any> = {
        name: form.name,
        shortDescription: form.shortDescription || undefined,
        longDescription: form.longDescription || undefined,
        categoryId: form.categoryId || undefined,
        subcategory: form.subcategory || undefined,
        priority: form.priority || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        address: form.address || undefined,
        directionsNote: form.directionsNote || undefined,
        nearestLandmark: form.nearestLandmark || undefined,
        estimatedTimeToSpend: form.estimatedTimeToSpend || undefined,
        bestTimeToVisit: form.bestTimeToVisit || undefined,
        bestSeason: form.bestSeason || undefined,
        entryFee: form.entryFee || undefined,
        dressCode: form.dressCode || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        instagram: form.instagram || undefined,
        parkingAvailable: form.parkingAvailable,
        wheelchairAccessible: form.wheelchairAccessible,
        petFriendly: form.petFriendly,
        wifiAvailable: form.wifiAvailable,
        familyFriendly: form.familyFriendly,
        budgetFriendly: form.budgetFriendly,
        localTip: form.localTip || undefined,
        warningNote: form.warningNote || undefined,
        openingHours: hours,
      };

      const res = await apiClient.updatePOI(poiId, payload);
      setPoi(res.data);
      setSuccess("POI saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save POI");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) return;
    try {
      await apiClient.addPOIPhoto(poiId, {
        url: photoUrl,
        caption: photoCaption || undefined,
        isPrimary: photos.length === 0,
      });
      setPhotoUrl("");
      setPhotoCaption("");
      const res = await apiClient.getPOIPhotos(poiId);
      setPhotos(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add photo");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await apiClient.deletePOIPhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    }
  };

  const handleStatusAction = async (action: "approve" | "reject" | "publish") => {
    try {
      setError("");
      if (action === "approve") {
        const res = await apiClient.approvePOI(poiId);
        setPoi(res.data);
      } else if (action === "reject") {
        const reason = prompt("Rejection reason:");
        if (!reason) return;
        const res = await apiClient.rejectPOI(poiId, reason);
        setPoi(res.data);
      } else if (action === "publish") {
        const res = await apiClient.publishPOI(poiId);
        setPoi(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!poi) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          POI not found
        </div>
      </div>
    );
  }

  const inputCls = "h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none";
  const textareaCls = "w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none resize-y min-h-[80px]";
  const selectCls = "h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none";
  const labelCls = "text-xs font-medium text-gray-400";

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        {poi.cityId && (
          <>
            <Link href={`/${adminPrefix}/cities/${poi.cityId}/pois`} className="text-gray-400 hover:text-white">POIs</Link>
            <ChevronRight />
          </>
        )}
        <span className="text-gray-200">{poi.name}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{poi.name}</h1>
          {poi.qualityScore != null && (
            <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
              Quality: {poi.qualityScore}%
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-400">{success}</div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-8 px-3 rounded-t-md text-[13px] transition-colors ${
              activeTab === tab
                ? "bg-gray-800 text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
        {/* Basic Tab */}
        {activeTab === "Basic" && (
          <>
            <div className="space-y-1">
              <label className={labelCls}>Name</label>
              <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Short Description</label>
              <textarea value={form.shortDescription} onChange={(e) => handleChange("shortDescription", e.target.value)} className={textareaCls} rows={2} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Long Description</label>
              <textarea value={form.longDescription} onChange={(e) => handleChange("longDescription", e.target.value)} className={textareaCls} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Category</label>
                <select value={form.categoryId} onChange={(e) => handleChange("categoryId", e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Subcategory</label>
                <input value={form.subcategory} onChange={(e) => handleChange("subcategory", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Priority</label>
              <div className="flex gap-3">
                {PRIORITIES.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-[13px] text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={form.priority === p}
                      onChange={() => handleChange("priority", p)}
                      className="accent-accent"
                    />
                    {p.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Location Tab */}
        {activeTab === "Location" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Address</label>
              <input value={form.address} onChange={(e) => handleChange("address", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Directions Note</label>
              <input value={form.directionsNote} onChange={(e) => handleChange("directionsNote", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Nearest Landmark</label>
              <input value={form.nearestLandmark} onChange={(e) => handleChange("nearestLandmark", e.target.value)} className={inputCls} />
            </div>
          </>
        )}

        {/* Tourist Tab */}
        {activeTab === "Tourist" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Time to Spend</label>
                <select value={form.estimatedTimeToSpend} onChange={(e) => handleChange("estimatedTimeToSpend", e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">Select</option>
                  {TIME_ESTIMATES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Best Time to Visit</label>
                <select value={form.bestTimeToVisit} onChange={(e) => handleChange("bestTimeToVisit", e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">Select</option>
                  {TIME_TO_VISIT.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Best Season</label>
                <select value={form.bestSeason} onChange={(e) => handleChange("bestSeason", e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">Select</option>
                  {BEST_SEASON.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Entry Fee</label>
                <input value={form.entryFee} onChange={(e) => handleChange("entryFee", e.target.value)} className={inputCls} placeholder="Free / 500 INR" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Dress Code</label>
              <input value={form.dressCode} onChange={(e) => handleChange("dressCode", e.target.value)} className={inputCls} />
            </div>
          </>
        )}

        {/* Contact Tab */}
        {activeTab === "Contact" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Website</label>
              <input value={form.website} onChange={(e) => handleChange("website", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Instagram</label>
              <input value={form.instagram} onChange={(e) => handleChange("instagram", e.target.value)} className={inputCls} placeholder="@handle" />
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === "Hours" && (
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <label className="text-[13px] text-gray-400 w-24">{day}</label>
                <input
                  value={hours[day] ?? ""}
                  onChange={(e) => setHours((prev) => ({ ...prev, [day]: e.target.value }))}
                  className={inputCls}
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
            ))}
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === "Flags" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(
              [
                ["parkingAvailable", "Parking"],
                ["wheelchairAccessible", "Wheelchair"],
                ["petFriendly", "Pet Friendly"],
                ["wifiAvailable", "WiFi"],
                ["familyFriendly", "Family Friendly"],
                ["budgetFriendly", "Budget Friendly"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[field] ?? false}
                  onChange={(e) => handleChange(field, e.target.checked)}
                  className="accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "Content" && (
          <>
            <div className="space-y-1">
              <label className={labelCls}>Local Tip</label>
              <textarea value={form.localTip} onChange={(e) => handleChange("localTip", e.target.value)} className={textareaCls} rows={3} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Warning Note</label>
              <textarea value={form.warningNote} onChange={(e) => handleChange("warningNote", e.target.value)} className={textareaCls} rows={3} />
            </div>
          </>
        )}

        {/* Photos Tab */}
        {activeTab === "Photos" && (
          <>
            <div className="space-y-2">
              {photos.length === 0 && (
                <p className="text-[13px] text-gray-500">No photos yet</p>
              )}
              {photos.map((photo: any) => (
                <div key={photo.id} className="flex items-center gap-3 p-2 border border-gray-800/50 rounded-md">
                  <div className="h-12 w-12 rounded bg-gray-800 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.caption ?? ""} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-200 truncate">{photo.url}</p>
                    {photo.caption && <p className="text-xs text-gray-500">{photo.caption}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {photo.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400">Primary</span>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="h-7 px-2 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-[13px] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800/50 pt-3 space-y-2">
              <h3 className="text-xs font-medium text-gray-400">Add Photo</h3>
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-gray-500">URL</label>
                  <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-gray-500">Caption</label>
                  <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className={inputCls} placeholder="Optional caption" />
                </div>
                <button
                  onClick={handleAddPhoto}
                  disabled={!photoUrl.trim()}
                  className="h-8 px-3 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}

        {/* Status Tab */}
        {activeTab === "Status" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] text-gray-400">Current Status:</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                poi.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-400" :
                poi.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                poi.status === "UNDER_REVIEW" ? "bg-amber-500/10 text-amber-400" :
                poi.status === "AI_SUGGESTED" ? "bg-blue-500/10 text-blue-400" :
                "bg-gray-500/10 text-gray-400"
              }`}>
                {poi.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(poi.status === "UNDER_REVIEW" || poi.status === "AI_SUGGESTED") && (
                <button
                  onClick={() => handleStatusAction("approve")}
                  className="h-8 px-3 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[13px] font-medium transition-colors"
                >
                  Approve
                </button>
              )}
              {(poi.status === "UNDER_REVIEW" || poi.status === "AI_SUGGESTED") && (
                <button
                  onClick={() => handleStatusAction("reject")}
                  className="h-8 px-3 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[13px] font-medium transition-colors"
                >
                  Reject
                </button>
              )}
              {poi.status === "APPROVED" && (
                <button
                  onClick={() => handleStatusAction("publish")}
                  className="h-8 px-3 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[13px] font-medium transition-colors"
                >
                  Publish
                </button>
              )}
            </div>
          </>
        )}
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
