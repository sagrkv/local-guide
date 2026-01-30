"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Prospect {
  id: string;
  businessName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  category: string;
  hasWebsite: boolean;
  score: number;
  lighthouseScore: number | null;
  createdAt: string;
  scrapeJob: {
    id: string;
    query: string;
    location: string | null;
    createdAt: string;
  } | null;
}

interface ProspectStats {
  counts: {
    prospects: number;
    leads: number;
    notInterested: number;
    archived: number;
  };
}

const CATEGORIES = [
  "STARTUP",
  "RESTAURANT",
  "HOTEL",
  "ECOMMERCE",
  "SALON",
  "CLINIC",
  "GYM",
  "RETAIL",
  "EDUCATION",
  "REAL_ESTATE",
  "AGENCY",
  "OTHER",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [scrapeJobs, setScrapeJobs] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [hasWebsite, setHasWebsite] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (selectedCity) params.city = selectedCity;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedJob) params.scrapeJobId = selectedJob;
      if (hasWebsite) params.hasWebsite = hasWebsite;
      if (minScore) params.minScore = parseInt(minScore);
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const response = await apiClient.getProspects(params);
      setProspects(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch {
      toast.error("Failed to load prospects");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    selectedCity,
    selectedCategory,
    selectedJob,
    hasWebsite,
    minScore,
    sortBy,
    sortOrder,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.getProspectStats();
      setStats(data);
    } catch {
      // Silently fail
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      const data = await apiClient.getProspectCities();
      setCities(data);
    } catch {
      // Silently fail
    }
  }, []);

  const fetchScrapeJobs = useCallback(async () => {
    try {
      const response = await apiClient.getScrapeJobs({ limit: 50 });
      setScrapeJobs(response.data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  useEffect(() => {
    fetchStats();
    fetchCities();
    fetchScrapeJobs();
  }, [fetchStats, fetchCities, fetchScrapeJobs]);

  const handleSelectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map((p) => p.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkPromote = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const result = await apiClient.bulkPromoteProspects(
        Array.from(selectedIds),
      );
      toast.success(`${result.count} prospects promoted to leads`);
      setSelectedIds(new Set());
      fetchProspects();
      fetchStats();
    } catch {
      toast.error("Failed to promote prospects");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(`Delete ${selectedIds.size} prospects? This cannot be undone.`)
    )
      return;
    setBulkLoading(true);
    try {
      const result = await apiClient.bulkDeleteProspects(
        Array.from(selectedIds),
      );
      toast.success(`${result.count} prospects deleted`);
      setSelectedIds(new Set());
      fetchProspects();
      fetchStats();
    } catch {
      toast.error("Failed to delete prospects");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkNotInterested = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const result = await apiClient.bulkMarkNotInterested(
        Array.from(selectedIds),
      );
      toast.success(`${result.count} prospects marked as not interested`);
      setSelectedIds(new Set());
      fetchProspects();
      fetchStats();
    } catch {
      toast.error("Failed to update prospects");
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePromoteSingle = async (id: string) => {
    try {
      await apiClient.promoteProspect(id);
      toast.success("Prospect promoted to lead");
      fetchProspects();
      fetchStats();
    } catch {
      toast.error("Failed to promote prospect");
    }
  };

  const handleArchiveSingle = async (id: string) => {
    try {
      await apiClient.archiveProspect(id);
      toast.success("Prospect archived");
      fetchProspects();
      fetchStats();
    } catch {
      toast.error("Failed to archive prospect");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCity("");
    setSelectedCategory("");
    setSelectedJob("");
    setHasWebsite("");
    setMinScore("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const activeFilterCount = [
    selectedCity,
    selectedCategory,
    selectedJob,
    hasWebsite,
    minScore,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Prospects</h1>
          <p className="text-gray-400 text-sm">
            Review scraped businesses and promote qualified ones to leads
          </p>
        </div>
        {stats && (
          <div className="flex gap-2">
            <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-center border border-gray-700">
              <p className="text-xl font-semibold text-yellow-400">
                {stats.counts.prospects}
              </p>
              <p className="text-[11px] text-gray-400">Pending</p>
            </div>
            <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-center border border-gray-700">
              <p className="text-xl font-semibold text-green-400">
                {stats.counts.leads}
              </p>
              <p className="text-[11px] text-gray-400">Promoted</p>
            </div>
            <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-center border border-gray-700">
              <p className="text-xl font-semibold text-gray-500">
                {stats.counts.notInterested}
              </p>
              <p className="text-[11px] text-gray-400">Rejected</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-accent w-full sm:w-56"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 px-3 border rounded-lg flex items-center gap-1.5 text-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-accent/20 border-accent text-accent"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            <FilterIcon className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-accent text-black text-[11px] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {/* Scrape Job Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Job
                </label>
                <select
                  value={selectedJob}
                  onChange={(e) => {
                    setSelectedJob(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {scrapeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.query}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Website Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Website
                </label>
                <select
                  value={hasWebsite}
                  onChange={(e) => {
                    setHasWebsite(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Min Score Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Min Score
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => {
                    setMinScore(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="createdAt">Added</option>
                  <option value="score">Score</option>
                  <option value="businessName">Name</option>
                  <option value="city">City</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-white font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkPromote}
              disabled={bulkLoading}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50 transition-colors"
            >
              Promote
            </button>
            <button
              onClick={handleBulkNotInterested}
              disabled={bulkLoading}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium disabled:opacity-50 transition-colors"
            >
              Not Interested
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === prospects.length &&
                    prospects.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-gray-700 text-accent focus:ring-accent"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Business
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                City
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Web
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No prospects found. Run a scrape job to discover new
                  businesses.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(prospect.id)}
                      onChange={() => handleToggleSelect(prospect.id)}
                      className="rounded border-gray-600 bg-gray-700 text-accent focus:ring-accent"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/prospects/${prospect.id}`}
                      className="text-[13px] font-medium text-white hover:text-accent transition-colors"
                    >
                      {prospect.businessName}
                    </Link>
                    <div className="text-[11px] text-gray-400">
                      {prospect.category.replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-300">
                      {prospect.email || "-"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {prospect.phone || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300">
                    {prospect.city || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {prospect.hasWebsite ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-green-500/20 text-green-400">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-500/20 text-gray-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            prospect.score >= 70
                              ? "bg-green-500"
                              : prospect.score >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${prospect.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {prospect.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {prospect.scrapeJob && (
                      <span className="text-[11px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                        {prospect.scrapeJob.query}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePromoteSingle(prospect.id)}
                        className="px-1.5 py-0.5 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => handleArchiveSingle(prospect.id)}
                        className="px-1.5 py-0.5 text-[11px] bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {prospects.length} of {total} prospects
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}
