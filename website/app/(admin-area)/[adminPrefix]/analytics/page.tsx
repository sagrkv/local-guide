"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  MapPin,
  Map,
  Users,
  Route,
  FolderOpen,
  TrendingUp,
} from "lucide-react";

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalCities: number;
  publishedCities: number;
  totalPOIs: number;
  publishedPOIs: number;
  totalItineraries: number;
  totalCollections: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthDataPoint[]>([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, userGrowthData] = await Promise.all([
        apiClient.getAdminAnalyticsOverview(),
        apiClient.getAdminUserGrowth(days),
      ]);

      setOverview(overviewData);
      setUserGrowth(userGrowthData);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-800 rounded-lg bg-gray-900 p-3 h-[72px] animate-pulse"
            />
          ))}
        </div>
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 h-[240px] animate-pulse" />
      </div>
    );
  }

  const maxGrowth = Math.max(...userGrowth.map((d) => d.count), 1);
  const displayPoints = userGrowth.slice(-14);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Analytics</h1>
          <p className="text-[13px] text-gray-400">
            Platform overview and growth
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="h-8 px-2 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Map className="h-3.5 w-3.5" />}
            label="Cities"
            value={overview.totalCities}
            sub={`${overview.publishedCities} published`}
            accent="text-blue-400"
          />
          <StatCard
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="POIs"
            value={overview.totalPOIs}
            sub={`${overview.publishedPOIs} published`}
            accent="text-emerald-400"
          />
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Users"
            value={overview.totalUsers}
            sub={`${overview.activeUsers} active`}
            accent="text-amber-400"
          />
          <StatCard
            icon={<Route className="h-3.5 w-3.5" />}
            label="Itineraries"
            value={overview.totalItineraries}
            sub={`${overview.totalCollections} collections`}
            accent="text-purple-400"
          />
        </div>
      )}

      {/* Content breakdown */}
      {overview && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800">
          <div className="p-3">
            <h2 className="text-sm font-medium text-gray-200">
              Content Breakdown
            </h2>
          </div>
          <div className="p-3 space-y-3">
            <ProgressRow
              label="Cities published"
              current={overview.publishedCities}
              total={overview.totalCities}
              color="bg-blue-400"
            />
            <ProgressRow
              label="POIs published"
              current={overview.publishedPOIs}
              total={overview.totalPOIs}
              color="bg-emerald-400"
            />
            <ProgressRow
              label="Active users"
              current={overview.activeUsers}
              total={overview.totalUsers}
              color="bg-amber-400"
            />
          </div>
        </div>
      )}

      {/* User growth chart */}
      {displayPoints.length > 0 && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800">
          <div className="flex items-center justify-between p-3">
            <h2 className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
              User Growth
            </h2>
            <span className="text-[11px] text-gray-500">
              {displayPoints[displayPoints.length - 1]?.count ?? 0} total
            </span>
          </div>
          <div className="p-3">
            <div className="h-36 flex items-end gap-1">
              {displayPoints.map((point, i) => {
                const height =
                  maxGrowth > 0 ? (point.count / maxGrowth) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.count}
                    </span>
                    <div
                      className="w-full bg-blue-500/60 rounded-sm hover:bg-blue-400/80 transition-colors"
                      style={{ height: `${Math.max(height, 3)}%` }}
                      title={`${point.date}: ${point.count}`}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-gray-600">
                        {formatDate(point.date)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards row */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-200">
                Collections
              </h3>
            </div>
            <div className="text-2xl font-semibold text-gray-100">
              {overview.totalCollections}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Curated POI collections across all cities
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-200">
                Itineraries
              </h3>
            </div>
            <div className="text-2xl font-semibold text-gray-100">
              {overview.totalItineraries}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Guided day/half-day itineraries for travelers
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accent}>{icon}</span>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-semibold text-gray-100`}>{value}</div>
      <span className="text-[11px] text-gray-500">{sub}</span>
    </div>
  );
}

function ProgressRow({
  label,
  current,
  total,
  color,
}: {
  label: string;
  current: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-gray-300">{label}</span>
        <span className="text-[11px] text-gray-500">
          {current}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
