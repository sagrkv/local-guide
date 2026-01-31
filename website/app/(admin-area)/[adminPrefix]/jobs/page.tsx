"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface JobOwner {
  id: string;
  name: string;
  email: string;
}

interface ScrapeJob {
  id: string;
  type: string;
  query: string;
  location: string | null;
  category: string | null;
  status: string;
  leadsFound: number;
  leadsCreated: number;
  leadsDuplicate: number;
  leadsSkipped: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  region: { id: string; name: string } | null;
  createdBy: JobOwner;
}

interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  last24h: { jobs: number; leadsCreated: number };
}

export default function JobMonitorPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter) params.status = statusFilter;

      const [jobsData, statsData] = await Promise.all([
        apiClient.getAdminJobs(params),
        apiClient.getAdminJobStats(),
      ]);

      setJobs(jobsData.jobs);
      setTotalPages(jobsData.pagination.totalPages);
      setTotal(jobsData.pagination.total);
      setStats(statsData);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for updates when there are running jobs
  useEffect(() => {
    if (!stats?.running || stats.running === 0) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [stats?.running, fetchData]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "RUNNING":
        return { bg: "bg-blue-500/10", text: "text-blue-400" };
      case "COMPLETED":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400" };
      case "FAILED":
        return { bg: "bg-red-500/10", text: "text-red-400" };
      case "CANCELLED":
        return { bg: "bg-zinc-500/10", text: "text-zinc-400" };
      default:
        return { bg: "bg-amber-500/10", text: "text-amber-400" };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Monitor</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Monitor all scraping jobs across all users (read-only)
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Jobs
            </span>
            <p className="text-2xl font-semibold text-white mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Running
              </span>
              {stats.running > 0 && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold text-blue-400 mt-1">
              {stats.running}
            </p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Completed
            </span>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">
              {stats.completed}
            </p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Failed
            </span>
            <p className="text-2xl font-semibold text-red-400 mt-1">
              {stats.failed}
            </p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Last 24h
            </span>
            <p className="text-2xl font-semibold text-white mt-1">
              {stats.last24h.leadsCreated}
            </p>
            <p className="text-xs text-zinc-500">{stats.last24h.jobs} jobs</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RUNNING">Running</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="text-sm text-zinc-500">{total} total jobs</span>
      </div>

      {/* Jobs Table */}
      <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-700/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Job
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Results
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/30">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-zinc-400"
                >
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const statusConfig = getStatusConfig(job.status);
                return (
                  <tr key={job.id} className="hover:bg-zinc-700/10">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          {job.query}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {job.location ||
                            job.region?.name ||
                            "Unknown location"}
                          {job.category && ` · ${job.category}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white">
                          {job.createdBy.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {job.createdBy.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {job.status === "RUNNING" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                        )}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">
                          {job.leadsCreated} created
                        </span>
                        {job.leadsDuplicate > 0 && (
                          <span className="text-zinc-500">
                            {job.leadsDuplicate} dup
                          </span>
                        )}
                        {job.leadsSkipped > 0 && (
                          <span className="text-zinc-500">
                            {job.leadsSkipped} skip
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {formatDate(job.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            Showing {jobs.length} of {total} jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
