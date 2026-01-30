"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard";
import { DueRemindersWidget } from "@/components/reminders/DueRemindersWidget";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  scrapeJobsToday: number;
  creditsUsedThisMonth: number;
}

interface RecentScrape {
  id: string;
  query: string;
  location: string | null;
  status: string;
  leadsCreated: number;
  createdAt: string;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScrapes, setRecentScrapes] = useState<RecentScrape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, scrapeJobsData] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getScrapeJobs({ limit: 5 }),
        ]);

        setStats({
          totalLeads: statsData.totalLeads || 0,
          newLeads: statsData.newLeads || 0,
          scrapeJobsToday: statsData.activeScrapeJobs || 0,
          creditsUsedThisMonth: statsData.leadsThisMonth || 0,
        });

        setRecentScrapes(scrapeJobsData.data || []);
      } catch {
        // Handle error silently, show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Welcome back! Here&apos;s your lead generation overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads"
          value={stats?.totalLeads || 0}
          icon={<UsersIcon />}
          color="default"
        />
        <StatCard
          label="New Leads"
          value={stats?.newLeads || 0}
          icon={<SparklesIcon />}
          color="blue"
        />
        <StatCard
          label="Active Scrapes"
          value={stats?.scrapeJobsToday || 0}
          icon={<SearchIcon />}
          color="orange"
        />
        <StatCard
          label="This Month"
          value={stats?.creditsUsedThisMonth || 0}
          icon={<CalendarIcon />}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h2 className="text-sm font-medium text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Link
                href="/dashboard/scrape/new"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-accent/10 hover:border-accent/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <MapIcon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[13px] font-medium text-white">New Scrape</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Find leads on map</p>
              </Link>

              <Link
                href="/dashboard/leads"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-blue-500/10 hover:border-blue-500/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                  <UsersIcon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[13px] font-medium text-white">View Leads</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Browse all leads</p>
              </Link>

              <Link
                href="/dashboard/scrape"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-purple-500/10 hover:border-purple-500/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center mb-2 group-hover:bg-purple-500/20 transition-colors">
                  <HistoryIcon className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[13px] font-medium text-white">History</p>
                <p className="text-[11px] text-gray-500 mt-0.5">View past jobs</p>
              </Link>

              <Link
                href="/dashboard/settings/credits"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                  <CoinIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[13px] font-medium text-white">Credits</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Top up balance</p>
              </Link>
            </div>
          </motion.div>

          {/* Recent Scrapes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-gray-800 rounded-lg bg-gray-900"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
              <h2 className="text-sm font-medium text-white">Recent Scrapes</h2>
              <Link
                href="/dashboard/scrape"
                className="text-[13px] text-accent hover:text-[#FF8C40] transition-colors"
              >
                View all
              </Link>
            </div>

            {recentScrapes.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-2">
                  <SearchIcon className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-[13px] text-gray-400">No scrapes yet</p>
                <Link
                  href="/dashboard/scrape/new"
                  className="text-[13px] text-accent hover:text-[#FF8C40] mt-1 inline-block"
                >
                  Start your first scrape
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {recentScrapes.map((scrape) => (
                  <div
                    key={scrape.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={scrape.status} />
                      <div>
                        <p className="text-[13px] font-medium text-white capitalize">
                          {scrape.query}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {scrape.location || "Unknown location"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-emerald-400">
                        {scrape.leadsCreated} leads
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatTimeAgo(scrape.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Due Reminders Widget */}
          <DueRemindersWidget />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Getting Started Guide (for new users) */}
          {stats && stats.totalLeads === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="border border-accent/30 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 p-4"
            >
              <h2 className="text-sm font-medium text-white mb-3">Getting Started</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] text-accent font-semibold">1</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">Start a Scrape</p>
                    <p className="text-[11px] text-gray-400">Select location and business type</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] text-accent font-semibold">2</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">Review Leads</p>
                    <p className="text-[11px] text-gray-400">Analyze and qualify prospects</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] text-accent font-semibold">3</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">Export & Outreach</p>
                    <p className="text-[11px] text-gray-400">Download and contact leads</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Activity Feed Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <p className="text-[13px] text-gray-300">{stats?.totalLeads || 0} total leads collected</p>
                  <p className="text-[11px] text-gray-500">All time</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-3 h-3 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[13px] text-gray-300">{stats?.newLeads || 0} new leads this week</p>
                  <p className="text-[11px] text-gray-500">Last 7 days</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tips Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pro Tip</h3>
            <p className="text-[13px] text-gray-300">
              Use pre-filters when scraping to only pay for leads that match your criteria.
            </p>
            <Link
              href="/dashboard/scrape/new"
              className="inline-flex items-center gap-1 text-[13px] text-accent hover:text-[#FF8C40] mt-2 transition-colors"
            >
              Try it now
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    RUNNING: { bg: "bg-blue-500/10", text: "text-blue-400" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400" },
    FAILED: { bg: "bg-red-500/10", text: "text-red-400" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className={`w-2 h-2 rounded-full ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.text.replace("text-", "bg-")} ${status === "RUNNING" ? "animate-pulse" : ""}`} />
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MapIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function HistoryIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CoinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
