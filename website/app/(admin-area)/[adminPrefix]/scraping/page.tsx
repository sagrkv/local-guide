"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface JobProgress {
  phase: "discovery" | "qualification" | "enriching" | "saving" | "finalizing";
  location?: string;
  currentBusiness?: string;
  discovered?: number;
  qualified?: number;
  created?: number;
  duplicates?: number;
  skipped?: number;
  total?: number;
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
  region: { id: string; name: string; cities: string[] } | null;
  createdBy: { id: string; name: string };
  progress?: JobProgress | null;
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

const BUSINESS_TYPES = [
  // Service businesses (B2C)
  { value: "clinic", label: "Clinics", icon: "🏥", category: "CLINIC" },
  { value: "dental", label: "Dental", icon: "🦷", category: "CLINIC" },
  { value: "salon", label: "Salons & Spas", icon: "💇", category: "SALON" },
  { value: "gym", label: "Gyms & Fitness", icon: "💪", category: "GYM" },

  // Hospitality
  { value: "hotel", label: "Hotels & Resorts", icon: "🏨", category: "HOTEL" },
  {
    value: "restaurant",
    label: "Restaurants",
    icon: "🍽",
    category: "RESTAURANT",
  },

  // Industrial / B2B (high value)
  {
    value: "manufacturer",
    label: "Manufacturers",
    icon: "🏭",
    category: "STARTUP",
  },
  { value: "exporter", label: "Exporters", icon: "📦", category: "ECOMMERCE" },
  { value: "warehouse", label: "Warehouses", icon: "🏢", category: "RETAIL" },
  {
    value: "engineering",
    label: "Engineering Firms",
    icon: "⚙️",
    category: "AGENCY",
  },

  // Professional services
  {
    value: "coaching",
    label: "Coaching & Training",
    icon: "📚",
    category: "EDUCATION",
  },
  {
    value: "retail",
    label: "Retail & Showrooms",
    icon: "🛍",
    category: "RETAIL",
  },

  // Real Estate
  {
    value: "real_estate",
    label: "Real Estate",
    icon: "🏠",
    category: "REAL_ESTATE",
  },

  // Startups & Tech
  { value: "startup", label: "Startups", icon: "🚀", category: "STARTUP" },
  {
    value: "agency",
    label: "Digital Agencies",
    icon: "💼",
    category: "AGENCY",
  },

  // Other - custom input
  { value: "__other__", label: "Other", icon: "✨", category: "OTHER" },
];

// Only cities with comprehensive zone data
const CITIES = ["Bangalore", "Hyderabad", "Chennai", "Mysore"];

const CATEGORIES = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hotel" },
  { value: "SALON", label: "Salon" },
  { value: "CLINIC", label: "Clinic" },
  { value: "GYM", label: "Gym" },
  { value: "RETAIL", label: "Retail" },
  { value: "EDUCATION", label: "Education" },
  { value: "STARTUP", label: "Startup" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "AGENCY", label: "Agency" },
  { value: "OTHER", label: "Other" },
];

export default function ScrapingPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    type: "DISCOVERY_PIPELINE",
    query: "",
    location: "",
    category: "",
    maxResults: 25,
  });
  const [creating, setCreating] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [isCustomQuery, setIsCustomQuery] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const previousJobsRef = useRef<Map<string, string>>(new Map());

  const fetchData = async () => {
    try {
      const [jobsData, statsData] = await Promise.all([
        apiClient.getScrapeJobs({ limit: 50 }),
        apiClient.getScrapingStats(),
      ]);

      const newJobs = jobsData.data as ScrapeJob[];
      newJobs.forEach((job) => {
        const previousStatus = previousJobsRef.current.get(job.id);
        if (previousStatus && previousStatus !== job.status) {
          if (job.status === "COMPLETED") {
            toast.success(`Scrape completed: ${job.query}`, {
              description: `Found ${job.leadsFound} leads, created ${job.leadsCreated} new leads.`,
            });
          } else if (job.status === "FAILED") {
            toast.error(`Scrape failed: ${job.query}`, {
              description: "Check the job details for more information.",
            });
          } else if (job.status === "RUNNING" && previousStatus === "PENDING") {
            toast.info(`Scrape started: ${job.query}`, {
              description: "Job is now running...",
            });
          }
        }
        previousJobsRef.current.set(job.id, job.status);
      });

      setJobs(newJobs);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveJobsRef = useRef(false);

  useEffect(() => {
    hasActiveJobsRef.current = jobs.some(
      (j) => j.status === "RUNNING" || j.status === "PENDING",
    );
  }, [jobs]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (hasActiveJobsRef.current) {
        fetchData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideInput = cityInputRef.current?.contains(target);
      const isInsideDropdown = cityDropdownRef.current?.contains(target);

      if (!isInsideInput && !isInsideDropdown) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the actual query to use
    const actualQuery = isCustomQuery ? customQuery.trim() : newJob.query;

    if (!actualQuery) {
      toast.error(
        isCustomQuery
          ? "Please enter a business type"
          : "Please select a business type",
      );
      return;
    }
    if (!newJob.location) {
      toast.error("Please select a city");
      return;
    }

    setCreating(true);
    try {
      await apiClient.createScrapeJob({
        type: newJob.type,
        query: actualQuery,
        location: newJob.location,
        category: newJob.category || undefined,
        maxResults: newJob.maxResults,
      });
      setShowNewJobModal(false);
      setNewJob({
        type: "DISCOVERY_PIPELINE",
        query: "",
        location: "",
        category: "",
        maxResults: 25,
      });
      setCitySearch("");
      setShowCityDropdown(false);
      setIsCustomQuery(false);
      setCustomQuery("");
      toast.success("Discovery started", {
        description: `Scanning ${newJob.location} for ${actualQuery}...`,
      });
      fetchData();
    } catch (error) {
      console.error("Failed to create job:", error);
      toast.error("Failed to start discovery", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelScrapeJob(jobId);
      toast.info("Job cancelled");
      fetchData();
    } catch (error) {
      console.error("Failed to cancel job:", error);
    }
  };

  const estimatedCost = (newJob.maxResults * 0.05).toFixed(2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lead Discovery
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Find businesses that need your services
          </p>
        </div>
        <button
          onClick={() => setShowNewJobModal(true)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Discovery
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Scans
              </span>
              <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-white mt-3">
              {stats.total}
            </p>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Active
              </span>
              {stats.running > 0 && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </div>
            <p className="text-3xl font-semibold text-blue-400 mt-3">
              {stats.running}
            </p>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Leads Found
              </span>
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-emerald-400 mt-3">
              {stats.leadsFromScraping}
            </p>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Last 24h
              </span>
            </div>
            <p className="text-3xl font-semibold text-white mt-3">
              {stats.last24h.leadsCreated}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {stats.last24h.jobs} jobs completed
            </p>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-700/50 flex items-center justify-between">
          <h2 className="font-medium text-white">Recent Discoveries</h2>
          <span className="text-xs text-zinc-500">{jobs.length} jobs</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-zinc-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">No discoveries yet</p>
            <p className="text-sm text-zinc-600 mt-1">
              Start your first scan to find leads
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/30">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onCancel={handleCancelJob} />
            ))}
          </div>
        )}
      </div>

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-zinc-700/50">
              <h2 className="text-lg font-semibold text-white">
                Start New Discovery
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Find businesses that need web services
              </p>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="p-6 space-y-6">
                {/* Business Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    What are you looking for?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          if (type.value === "__other__") {
                            setIsCustomQuery(true);
                            setNewJob({
                              ...newJob,
                              query: "",
                              category: type.category,
                            });
                          } else {
                            setIsCustomQuery(false);
                            setCustomQuery("");
                            setNewJob({
                              ...newJob,
                              query: type.value,
                              category: type.category,
                            });
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                          (type.value === "__other__" && isCustomQuery) ||
                          (type.value !== "__other__" &&
                            newJob.query === type.value &&
                            !isCustomQuery)
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                            : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                      >
                        <span className="text-xl block mb-1">{type.icon}</span>
                        <span className="text-xs font-medium">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Query Input - shown when "Other" is selected */}
                  {isCustomQuery && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Enter custom business type
                      </label>
                      <input
                        type="text"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="e.g., Pet shops, Jewellery stores, Furniture showrooms..."
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                        autoFocus
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        Tip: Be specific for better results. Example: "pet
                        grooming" instead of just "pets"
                      </p>
                    </div>
                  )}
                </div>

                {/* City Selection - Searchable */}
                <div className="relative">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <input
                      ref={cityInputRef}
                      type="text"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCityDropdown(true);
                        if (!e.target.value) {
                          setNewJob({ ...newJob, location: "" });
                        }
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder={newJob.location || "Search for a city..."}
                      className={`w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all ${newJob.location && !citySearch ? "text-white" : ""}`}
                    />
                    {newJob.location && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewJob({ ...newJob, location: "" });
                          setCitySearch("");
                          cityInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {showCityDropdown && (
                    <div
                      ref={cityDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                    >
                      {CITIES.filter((city) =>
                        city.toLowerCase().includes(citySearch.toLowerCase()),
                      ).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-zinc-500">
                          No cities found
                        </div>
                      ) : (
                        CITIES.filter((city) =>
                          city.toLowerCase().includes(citySearch.toLowerCase()),
                        ).map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setNewJob({ ...newJob, location: city });
                              setCitySearch("");
                              setShowCityDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-700/50 transition-colors ${
                              newJob.location === city
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-zinc-300"
                            }`}
                          >
                            {city}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Max Results */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Maximum leads to find
                  </label>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setNewJob({ ...newJob, maxResults: num })
                        }
                        className={`flex-1 py-2.5 rounded-lg border font-medium transition-all ${
                          newJob.maxResults === num
                            ? "bg-zinc-700 border-zinc-600 text-white"
                            : "bg-zinc-800/30 border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Estimate */}
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Estimated cost</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Google Places API + Perplexity enrichment
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        ${estimatedCost}
                      </p>
                      <p className="text-xs text-zinc-600">~$0.05/lead</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-700/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    creating ||
                    (!isCustomQuery && !newJob.query) ||
                    (isCustomQuery && !customQuery.trim()) ||
                    !newJob.location
                  }
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-medium rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    "Start Discovery"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  onCancel,
}: {
  job: ScrapeJob;
  onCancel: (id: string) => void;
}) {
  const [liveProgress, setLiveProgress] = useState<JobProgress | null>(
    job.progress || null,
  );
  const [liveJob, setLiveJob] = useState(job);

  // Poll for progress updates when job is running
  useEffect(() => {
    if (job.status !== "RUNNING") {
      setLiveProgress(null);
      setLiveJob(job);
      return;
    }

    const pollProgress = async () => {
      try {
        const updatedJob = await apiClient.getScrapeJob(job.id);
        setLiveJob(updatedJob);
        if (updatedJob.progress) {
          setLiveProgress(updatedJob.progress);
        }
      } catch {
        // Ignore errors during polling
      }
    };

    // Poll every 2 seconds for running jobs
    pollProgress();
    const interval = setInterval(pollProgress, 2000);
    return () => clearInterval(interval);
  }, [job.id, job.status]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "RUNNING":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/20",
        };
      case "COMPLETED":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
        };
      case "FAILED":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          border: "border-red-500/20",
        };
      case "CANCELLED":
        return {
          bg: "bg-zinc-500/10",
          text: "text-zinc-400",
          border: "border-zinc-500/20",
        };
      default:
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/20",
        };
    }
  };

  const getPhaseConfig = (phase: string) => {
    switch (phase) {
      case "discovery":
        return {
          label: "Discovering businesses",
          icon: "🔍",
          color: "text-blue-400",
          bgColor: "bg-blue-500",
        };
      case "qualification":
        return {
          label: "Analyzing websites",
          icon: "📊",
          color: "text-amber-400",
          bgColor: "bg-amber-500",
        };
      case "enriching":
        return {
          label: "Enriching data",
          icon: "✨",
          color: "text-violet-400",
          bgColor: "bg-violet-500",
        };
      case "saving":
        return {
          label: "Saving leads",
          icon: "💾",
          color: "text-emerald-400",
          bgColor: "bg-emerald-500",
        };
      case "finalizing":
        return {
          label: "Finalizing",
          icon: "🏁",
          color: "text-emerald-400",
          bgColor: "bg-emerald-500",
        };
      default:
        return {
          label: "Processing",
          icon: "⏳",
          color: "text-zinc-400",
          bgColor: "bg-zinc-500",
        };
    }
  };

  const statusConfig = getStatusConfig(liveJob.status);
  const isActive = liveJob.status === "RUNNING" || liveJob.status === "PENDING";
  const phaseConfig = liveProgress
    ? getPhaseConfig(liveProgress.phase)
    : getPhaseConfig("discovery");

  // Calculate progress percentage
  const progressPercent =
    liveProgress && liveProgress.total && liveProgress.total > 0
      ? Math.min(
          ((liveProgress.created || 0) +
            (liveProgress.duplicates || 0) +
            (liveProgress.skipped || 0)) /
            liveProgress.total,
          1,
        ) * 100
      : 0;

  return (
    <div className="px-5 py-4 hover:bg-zinc-700/10 transition-colors">
      <div className="flex items-start gap-4">
        {/* Status Indicator */}
        <div
          className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl ${statusConfig.bg} ${statusConfig.border} border flex items-center justify-center`}
        >
          {liveJob.status === "RUNNING" ? (
            <svg
              className="w-5 h-5 text-blue-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : liveJob.status === "COMPLETED" ? (
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : liveJob.status === "FAILED" ? (
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : liveJob.status === "PENDING" ? (
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white capitalize">
              {liveJob.query}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-md ${statusConfig.bg} ${statusConfig.text}`}
            >
              {liveJob.status}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {liveJob.location || liveJob.region?.name || "Unknown location"}
            {liveJob.category && ` · ${liveJob.category}`}
          </p>

          {/* Enhanced Progress for running jobs */}
          {liveJob.status === "RUNNING" && (
            <div className="mt-3 space-y-3">
              {/* Phase indicator with current business */}
              <div className="flex items-center gap-3">
                <span className="text-lg">{phaseConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${phaseConfig.color}`}
                    >
                      {phaseConfig.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  </div>
                  {liveProgress?.currentBusiness && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      Processing:{" "}
                      <span className="text-zinc-400">
                        {liveProgress.currentBusiness}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Live stats */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {(liveProgress?.discovered ?? liveJob.leadsFound) > 0 && (
                  <span className="text-blue-400">
                    <span className="font-semibold">
                      {liveProgress?.discovered ?? liveJob.leadsFound}
                    </span>{" "}
                    found
                  </span>
                )}
                {(liveProgress?.created ?? liveJob.leadsCreated) > 0 && (
                  <span className="text-emerald-400">
                    <span className="font-semibold">
                      {liveProgress?.created ?? liveJob.leadsCreated}
                    </span>{" "}
                    created
                  </span>
                )}
                {(liveProgress?.duplicates ?? liveJob.leadsDuplicate) > 0 && (
                  <span className="text-zinc-500">
                    {liveProgress?.duplicates ?? liveJob.leadsDuplicate}{" "}
                    duplicates
                  </span>
                )}
                {(liveProgress?.skipped ?? liveJob.leadsSkipped) > 0 && (
                  <span className="text-zinc-500">
                    {liveProgress?.skipped ?? liveJob.leadsSkipped} skipped
                  </span>
                )}
                {liveProgress?.total && liveProgress.total > 0 && (
                  <span className="text-zinc-600">
                    of {liveProgress.total} total
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                {progressPercent > 0 ? (
                  <div
                    className={`h-full ${phaseConfig.bgColor} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(progressPercent, 5)}%` }}
                  />
                ) : (
                  <div
                    className={`h-full ${phaseConfig.bgColor} rounded-full animate-pulse`}
                    style={{ width: "30%" }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Pending status */}
          {liveJob.status === "PENDING" && (
            <div className="mt-2 text-xs text-amber-400/80 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Waiting in queue...
            </div>
          )}

          {/* Results for completed jobs */}
          {liveJob.status === "COMPLETED" && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-emerald-400">
                <span className="font-semibold">{liveJob.leadsCreated}</span>{" "}
                leads created
              </span>
              {liveJob.leadsDuplicate > 0 && (
                <span className="text-zinc-500">
                  {liveJob.leadsDuplicate} duplicates
                </span>
              )}
              {liveJob.leadsSkipped > 0 && (
                <span className="text-zinc-500">
                  {liveJob.leadsSkipped} skipped
                </span>
              )}
            </div>
          )}

          {/* Failed status */}
          {liveJob.status === "FAILED" && (
            <div className="mt-2 text-xs text-red-400/80 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Job failed - check logs for details
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {isActive && (
            <button
              onClick={() => onCancel(liveJob.id)}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          )}
          <span className="text-xs text-zinc-600">
            {new Date(liveJob.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
