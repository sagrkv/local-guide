"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalProspects: number;
  totalCreditsUsed: number;
  totalCreditsAdded: number;
  activeJobs: number;
  completedJobs: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
}

interface CreditUsageDataPoint {
  date: string;
  used: number;
  added: number;
}

interface TopUser {
  id: string;
  name: string;
  email: string;
  leadsCount: number;
  creditsUsed: number;
}

interface ScrapeJobStats {
  totalJobs: number;
  successRate: number;
  avgLeadsPerJob: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
}

interface CategoryData {
  category: string;
  count: number;
}

interface GeographicData {
  cities: Array<{ city: string; count: number }>;
  states: Array<{ state: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthDataPoint[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsageDataPoint[]>([]);
  const [leadGrowth, setLeadGrowth] = useState<GrowthDataPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [scrapeStats, setScrapeStats] = useState<ScrapeJobStats | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [geography, setGeography] = useState<GeographicData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        userGrowthData,
        creditUsageData,
        leadGrowthData,
        topUsersData,
        scrapeStatsData,
        categoriesData,
        geographyData,
      ] = await Promise.all([
        apiClient.getAdminAnalyticsOverview(),
        apiClient.getAdminUserGrowth(days),
        apiClient.getAdminCreditUsage(days),
        apiClient.getAdminLeadGrowth(days),
        apiClient.getAdminTopUsers(10),
        apiClient.getAdminScrapeJobStats(days),
        apiClient.getAdminCategoryDistribution(),
        apiClient.getAdminGeographicDistribution(),
      ]);

      setOverview(overviewData);
      setUserGrowth(userGrowthData);
      setCreditUsage(creditUsageData);
      setLeadGrowth(leadGrowthData);
      setTopUsers(topUsersData);
      setScrapeStats(scrapeStatsData);
      setCategories(categoriesData);
      setGeography(geographyData);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getMaxCount = (data: GrowthDataPoint[]) => {
    return Math.max(...data.map((d) => d.count), 1);
  };

  const getMaxCreditUsage = (data: CreditUsageDataPoint[]) => {
    return Math.max(...data.map((d) => Math.max(d.used, d.added)), 1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Platform-wide statistics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time range:</span>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={overview.totalUsers}
            subValue={`${overview.activeUsers} active`}
            icon={<UsersIcon />}
            color="blue"
          />
          <StatCard
            label="Total Leads"
            value={overview.totalLeads}
            subValue={`${overview.totalProspects} prospects`}
            icon={<LeadsIcon />}
            color="green"
          />
          <StatCard
            label="Credits Used"
            value={overview.totalCreditsUsed}
            subValue={`${overview.totalCreditsAdded} added`}
            icon={<CreditsIcon />}
            color="purple"
          />
          <StatCard
            label="Scrape Jobs"
            value={overview.completedJobs}
            subValue={`${overview.activeJobs} active`}
            icon={<JobsIcon />}
            color="orange"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="h-48 flex items-end gap-1">
            {userGrowth.slice(-14).map((point, i) => {
              const maxCount = getMaxCount(userGrowth);
              const height = (point.count / maxCount) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${point.count} users`}
                  />
                  <span className="text-[10px] text-gray-500 -rotate-45 origin-left">
                    {formatDate(point.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Total: {userGrowth[userGrowth.length - 1]?.count || 0} users
          </p>
        </div>

        {/* Lead Growth Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Lead Growth</h3>
          <div className="h-48 flex items-end gap-1">
            {leadGrowth.slice(-14).map((point, i) => {
              const maxCount = getMaxCount(leadGrowth);
              const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-400"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.date}: ${point.count} leads`}
                  />
                  <span className="text-[10px] text-gray-500 -rotate-45 origin-left">
                    {formatDate(point.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Total in period:{" "}
            {leadGrowth.reduce((sum, d) => sum + d.count, 0)} leads
          </p>
        </div>
      </div>

      {/* Credit Usage Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Credit Usage Over Time</h3>
        <div className="h-48 flex items-end gap-1">
          {creditUsage.slice(-14).map((point, i) => {
            const maxUsage = getMaxCreditUsage(creditUsage);
            const usedHeight = maxUsage > 0 ? (point.used / maxUsage) * 100 : 0;
            const addedHeight = maxUsage > 0 ? (point.added / maxUsage) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-400"
                    style={{ height: `${Math.max(addedHeight, 1)}%` }}
                    title={`Added: ${point.added}`}
                  />
                  <div
                    className="w-full bg-red-500 rounded-b transition-all hover:bg-red-400"
                    style={{ height: `${Math.max(usedHeight, 1)}%` }}
                    title={`Used: ${point.used}`}
                  />
                </div>
                <span className="text-[10px] text-gray-500 -rotate-45 origin-left">
                  {formatDate(point.date)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-gray-400">
              Added: {formatNumber(creditUsage.reduce((sum, d) => sum + d.added, 0))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-400">
              Used: {formatNumber(creditUsage.reduce((sum, d) => sum + d.used, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Users */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Users by Leads</h3>
          <div className="space-y-3">
            {topUsers.slice(0, 5).map((user, i) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="text-gray-500 w-4">{i + 1}.</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-black text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{user.leadsCount}</p>
                  <p className="text-xs text-gray-400">
                    {user.creditsUsed} credits
                  </p>
                </div>
              </div>
            ))}
            {topUsers.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                No data available
              </p>
            )}
          </div>
        </div>

        {/* Scrape Job Stats */}
        {scrapeStats && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Scrape Job Statistics</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{scrapeStats.totalJobs}</p>
                  <p className="text-xs text-gray-400">Total Jobs</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {scrapeStats.successRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">Success Rate</p>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent">
                  {scrapeStats.avgLeadsPerJob.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">Avg Leads per Job</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">By Status</p>
                <div className="flex flex-wrap gap-2">
                  {scrapeStats.byStatus.map((s) => (
                    <span
                      key={s.status}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : s.status === "FAILED"
                            ? "bg-red-500/20 text-red-400"
                            : s.status === "RUNNING"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {s.status}: {s.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Distribution */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Lead Categories</h3>
          <div className="space-y-3">
            {categories.slice(0, 6).map((cat) => {
              const maxCount = Math.max(...categories.map((c) => c.count), 1);
              const percentage = (cat.count / maxCount) * 100;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">{cat.category}</span>
                    <span className="text-gray-400">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                No data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      {geography && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Top Cities</h3>
            <div className="space-y-3">
              {geography.cities.slice(0, 8).map((city, i) => {
                const maxCount = Math.max(
                  ...geography.cities.map((c) => c.count),
                  1
                );
                const percentage = (city.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{city.city}</span>
                      <span className="text-gray-400">{city.count}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">States</h3>
            <div className="space-y-3">
              {geography.states.slice(0, 8).map((state, i) => {
                const maxCount = Math.max(
                  ...geography.states.map((s) => s.count),
                  1
                );
                const percentage = (state.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{state.state}</span>
                      <span className="text-gray-400">{state.count}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  color,
}: {
  label: string;
  value: number;
  subValue: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${colorClasses[color].split(" ")[0]}`}>
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Icons
function UsersIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CreditsIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}
