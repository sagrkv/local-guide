"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface DiscoveryJob {
  id: string;
  status: string;
  categorySlug?: string;
  searchQuery?: string;
  candidatesFound?: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-500/10 text-gray-400",
  RUNNING: "bg-blue-500/10 text-blue-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-400",
  FAILED: "bg-red-500/10 text-red-400",
  CANCELLED: "bg-gray-500/10 text-gray-400",
};

export default function AIDiscoveryPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [starting, setStarting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catsRes, jobsRes] = await Promise.allSettled([
        apiClient.getCategories({ limit: 100 }),
        apiClient.getDiscoveryJobs({ cityId, limit: 20 }),
      ]);

      if (catsRes.status === "fulfilled") {
        setCategories(catsRes.value.data ?? []);
      }
      if (jobsRes.status === "fulfilled") {
        setJobs(jobsRes.value.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartDiscovery = async () => {
    try {
      setStarting(true);
      setError("");
      await apiClient.startDiscovery(cityId, {
        categorySlug: selectedCategory || undefined,
        searchQuery: searchQuery || undefined,
      });
      setSelectedCategory("");
      setSearchQuery("");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start discovery");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <span className="text-gray-200">AI Discovery</span>
      </nav>

      <h1 className="text-xl font-semibold">AI Discovery</h1>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {/* Start Discovery */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-200">Start Discovery</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 w-[180px] rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.emoji ? `${c.emoji} ` : ""}{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-400">Search Query (optional)</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
              placeholder="e.g. best restaurants"
            />
          </div>
          <button
            onClick={handleStartDiscovery}
            disabled={starting}
            className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Discovery"}
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link
          href={`/${adminPrefix}/cities/${cityId}/review`}
          className="text-accent hover:underline"
        >
          Review Queue
        </Link>
        <span className="text-gray-600">|</span>
        <Link
          href={`/${adminPrefix}/cities/${cityId}/pois`}
          className="text-accent hover:underline"
        >
          All POIs
        </Link>
      </div>

      {/* Recent Jobs */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-200">Recent Jobs</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Query</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Candidates</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[13px] text-gray-500">
                    No discovery jobs yet
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-gray-300">{job.categorySlug || "All"}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{job.searchQuery || "—"}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{job.candidatesFound ?? "—"}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
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
