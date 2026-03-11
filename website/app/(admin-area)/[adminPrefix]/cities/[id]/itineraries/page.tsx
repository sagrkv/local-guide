"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface Itinerary {
  id: string;
  title: string;
  duration: string;
  status: string;
  difficulty?: string;
  _count?: { stops: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400",
  ARCHIVED: "bg-red-500/10 text-red-400",
};

export default function ItinerariesListPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [items, setItems] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCityItineraries(cityId, { limit: 50 });
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load itineraries");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDuration.trim()) return;
    try {
      setCreating(true);
      setError("");
      const res = await apiClient.createItinerary({
        cityId,
        title: newTitle,
        duration: newDuration,
      });
      const id = res.data?.id;
      if (id) {
        router.push(`/${adminPrefix}/cities/${cityId}/itineraries/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create itinerary");
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
        <span className="text-gray-200">Itineraries</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Itineraries</h1>
      </div>

      {/* Quick create */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-200">New Itinerary</h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-gray-400">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder="e.g. Heritage Walk Day 1"
            />
          </div>
          <div className="space-y-1 w-[140px]">
            <label className="text-xs font-medium text-gray-400">Duration</label>
            <input
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder="Half day"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim() || !newDuration.trim()}
            className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stops</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[13px] text-gray-500">
                    No itineraries yet
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/${adminPrefix}/cities/${cityId}/itineraries/${item.id}`)}
                  className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2 text-[13px] text-gray-200 font-medium">{item.title}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{item.duration}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{item._count?.stops ?? 0}</td>
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
