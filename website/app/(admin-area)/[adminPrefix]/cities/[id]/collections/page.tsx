"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface Collection {
  id: string;
  title: string;
  description?: string;
  status: string;
  type?: string;
  _count?: { items: number };
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400",
  ARCHIVED: "bg-red-500/10 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  curated: "Curated",
  mood: "Mood",
  day_trip: "Day Trip",
  seasonal: "Seasonal",
  locals_week: "Locals Week",
};

export default function CollectionsListPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("curated");
  const [newIcon, setNewIcon] = useState("");
  const [newTravelTime, setNewTravelTime] = useState("");
  const [newActiveMonths, setNewActiveMonths] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCityCollections(cityId, { limit: 50 });
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMonth = (month: number) => {
    setNewActiveMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      setError("");
      const payload: Record<string, unknown> = {
        cityId,
        title: newTitle,
        type: newType,
      };
      if (newType === "mood" && newIcon.trim()) payload.icon = newIcon.trim();
      if (newType === "day_trip" && newTravelTime.trim()) payload.travelTime = newTravelTime.trim();
      if (newType === "seasonal" && newActiveMonths.length > 0) payload.activeMonths = newActiveMonths;

      const res = await apiClient.createCollection(payload);
      const id = res.data?.id;
      if (id) {
        router.push(`/${adminPrefix}/cities/${cityId}/collections/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <span className="text-gray-200">Collections</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Collections</h1>
      </div>

      {/* Quick create */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-200">New Collection</h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-gray-400">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder="e.g. Best Street Food Spots"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
            >
              <option value="curated">Curated</option>
              <option value="mood">Mood</option>
              <option value="day_trip">Day Trip</option>
              <option value="seasonal">Seasonal</option>
              <option value="locals_week">Locals Week</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>

        {/* Conditional fields based on type */}
        {newType === "mood" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Icon / Emoji</label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="h-8 w-48 rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder='e.g. "chill", "romantic"'
            />
          </div>
        )}
        {newType === "day_trip" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Travel Time</label>
            <input
              value={newTravelTime}
              onChange={(e) => setNewTravelTime(e.target.value)}
              className="h-8 w-48 rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder='e.g. "20 min", "1 hr"'
            />
          </div>
        )}
        {newType === "seasonal" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Active Months</label>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_LABELS.map((label, i) => {
                const month = i + 1;
                const active = newActiveMonths.includes(month);
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => toggleMonth(month)}
                    className={`h-7 px-2 rounded text-[11px] font-medium border transition-colors ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-gray-700 bg-gray-950 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {newType === "locals_week" && (
          <p className="text-xs text-amber-400/80">Locals Week collections require exactly 7 items (one per day).</p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[13px] text-gray-500">
                    No collections yet
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/${adminPrefix}/cities/${cityId}/collections/${item.id}`)}
                  className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2">
                    <p className="text-[13px] text-gray-200 font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[11px] text-gray-400">{TYPE_LABELS[item.type ?? "curated"] ?? item.type}</span>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{item._count?.items ?? 0}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[item.status] ?? STATUS_STYLES.DRAFT}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
