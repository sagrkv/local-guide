"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

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
}

interface JobProgress {
  phase?: "discovery" | "discovery_complete" | "qualification" | "enriching" | "complete";
  location?: string;
  gridPoint?: number;
  totalGridPoints?: number;
  businessesFound?: number;
  currentBusiness?: string;
  qualified?: number;
  created?: number;
  duplicates?: number;
  skipped?: number;
  filteredOut?: number;
  matchedFilters?: number;
  totalFound?: number;
  total?: number;
  totalBusinesses?: number;
  withWebsites?: number;
  withoutWebsites?: number;
}

interface ScrapingStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  leadsFromScraping: number;
  last24h: { jobs: number; leadsCreated: number };
}

export default function ScrapePage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [jobProgress, setJobProgress] = useState<Record<string, JobProgress>>({});
  const previousJobsRef = useRef<Map<string, string>>(new Map());
  const hasActiveJobsRef = useRef(false);
  const progressPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const [jobsData, statsData] = await Promise.all([
        apiClient.getScrapeJobs({ limit: 50, status: filter === "all" ? undefined : filter.toUpperCase() }),
        apiClient.getScrapingStats(),
      ]);

      const newJobs = jobsData.data as ScrapeJob[];

      newJobs.forEach((job) => {
        const previousStatus = previousJobsRef.current.get(job.id);
        if (previousStatus && previousStatus !== job.status) {
          if (job.status === "COMPLETED") {
            toast.success(`Scrape completed: ${job.query}`, {
              description: `Created ${job.leadsCreated} new leads.`,
            });
          } else if (job.status === "FAILED") {
            toast.error(`Scrape failed: ${job.query}`);
          }
        }
        previousJobsRef.current.set(job.id, job.status);
      });

      setJobs(newJobs);
      setStats(statsData);
    } catch {
      toast.error("Failed to fetch scrape history");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressForRunningJobs = async (runningJobs: ScrapeJob[]) => {
    const progressUpdates: Record<string, JobProgress> = {};

    await Promise.all(
      runningJobs.map(async (job) => {
        try {
          const jobData = await apiClient.getScrapeJob(job.id);
          if (jobData?.progress) {
            progressUpdates[job.id] = jobData.progress as JobProgress;
          }
        } catch {
          // Ignore individual job fetch errors
        }
      })
    );

    if (Object.keys(progressUpdates).length > 0) {
      setJobProgress((prev) => ({ ...prev, ...progressUpdates }));
    }
  };

  useEffect(() => {
    const runningJobs = jobs.filter((j) => j.status === "RUNNING");
    hasActiveJobsRef.current = jobs.some(
      (j) => j.status === "RUNNING" || j.status === "PENDING"
    );

    // Set up fast progress polling for running jobs (every 2 seconds)
    if (progressPollIntervalRef.current) {
      clearInterval(progressPollIntervalRef.current);
      progressPollIntervalRef.current = null;
    }

    if (runningJobs.length > 0) {
      // Fetch immediately
      fetchProgressForRunningJobs(runningJobs);

      // Then poll every 2 seconds
      progressPollIntervalRef.current = setInterval(() => {
        fetchProgressForRunningJobs(runningJobs);
      }, 2000);
    } else {
      // Clear progress data for completed jobs
      setJobProgress({});
    }

    return () => {
      if (progressPollIntervalRef.current) {
        clearInterval(progressPollIntervalRef.current);
      }
    };
  }, [jobs]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (hasActiveJobsRef.current) {
        fetchData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelScrapeJob(jobId);
      toast.info("Job cancelled");
      fetchData();
    } catch {
      toast.error("Failed to cancel job");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Scrape</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">View and manage your scraping jobs</p>
        </div>
        <Link
          href="/dashboard/scrape/new"
          className="h-8 px-3 bg-accent hover:bg-[#FF8C40] text-background text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Scrape
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Scans" value={stats.total} icon={<ClipboardIcon />} />
          <StatCard
            label="Active"
            value={stats.running}
            icon={<SpinnerIcon />}
            isActive={stats.running > 0}
          />
          <StatCard label="Leads Found" value={stats.leadsFromScraping} icon={<UsersIcon />} color="emerald" />
          <StatCard
            label="Last 24h"
            value={stats.last24h.leadsCreated}
            sublabel={`${stats.last24h.jobs} jobs`}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {["all", "running", "completed", "pending", "failed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`
              h-8 px-3 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap
              ${
                filter === tab
                  ? "bg-accent/10 text-accent"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== "all" && stats && (
              <span className="ml-1 text-[11px] opacity-60">
                ({stats[tab as keyof Pick<ScrapingStats, "pending" | "running" | "completed" | "failed">] || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
        {jobs.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="divide-y divide-gray-800/50">
            {jobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                onCancel={handleCancelJob}
                progress={jobProgress[job.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = "default",
  isActive = false,
}: {
  label: string;
  value: number;
  sublabel?: string;
  icon?: React.ReactNode;
  color?: "default" | "emerald";
  isActive?: boolean;
}) {
  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
            color === "emerald" ? "bg-emerald-500/10" : "bg-gray-800"
          }`}>
            {icon}
          </div>
        )}
        {isActive && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </div>
      <p className={`text-2xl font-semibold mt-2 ${
        color === "emerald" ? "text-emerald-400" : isActive ? "text-blue-400" : "text-white"
      }`}>
        {value.toLocaleString()}
      </p>
      {sublabel && <p className="text-[11px] text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function JobCard({
  job,
  index,
  onCancel,
  progress,
}: {
  job: ScrapeJob;
  index: number;
  onCancel: (id: string) => void;
  progress?: JobProgress;
}) {
  const isActive = job.status === "RUNNING" || job.status === "PENDING";

  const statusConfig: Record<string, { bg: string; text: string }> = {
    RUNNING: { bg: "bg-blue-500/10", text: "text-blue-400" },
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    FAILED: { bg: "bg-red-500/10", text: "text-red-400" },
    CANCELLED: { bg: "bg-gray-500/10", text: "text-gray-400" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400" },
  };

  const config = statusConfig[job.status] || statusConfig.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-md ${config.bg} border border-current/20 flex items-center justify-center ${config.text}`}
        >
          {job.status === "RUNNING" ? (
            <SpinnerIcon className="w-4 h-4 animate-spin" />
          ) : job.status === "COMPLETED" ? (
            <CheckIcon className="w-4 h-4" />
          ) : job.status === "FAILED" ? (
            <XIcon className="w-4 h-4" />
          ) : job.status === "PENDING" ? (
            <ClockIcon className="w-4 h-4" />
          ) : (
            <StopIcon className="w-4 h-4" />
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-medium text-white capitalize">{job.query}</h3>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${config.bg} ${config.text}`}>
              {job.status}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {job.location || "Unknown location"}
            {job.category && ` - ${job.category}`}
          </p>

          {job.status === "COMPLETED" && (
            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
              <span className="text-emerald-400">
                <span className="font-semibold">{job.leadsCreated}</span> created
              </span>
              {job.leadsDuplicate > 0 && (
                <span className="text-gray-500">{job.leadsDuplicate} duplicates</span>
              )}
              {job.leadsSkipped > 0 && (
                <span className="text-gray-500">{job.leadsSkipped} skipped</span>
              )}
            </div>
          )}

          {job.status === "RUNNING" && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Processing...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {isActive && (
            <button
              onClick={() => onCancel(job.id)}
              className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          )}
          <span className="text-[11px] text-gray-600">
            {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="p-8 text-center">
      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
        <SearchIcon className="w-6 h-6 text-gray-600" />
      </div>
      <p className="text-[13px] text-gray-400 font-medium">
        {filter === "all" ? "No scrapes yet" : `No ${filter} scrapes`}
      </p>
      <p className="text-[11px] text-gray-500 mt-1">
        {filter === "all" ? "Start your first scan to find leads" : "Try a different filter"}
      </p>
      {filter === "all" && (
        <Link
          href="/dashboard/scrape/new"
          className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-accent hover:text-[#FF8C40]"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Start a new scrape
        </Link>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-3.5 h-3.5 text-gray-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SpinnerIcon({ className = "w-3.5 h-3.5 text-blue-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function UsersIcon({ className = "w-3.5 h-3.5 text-emerald-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}
