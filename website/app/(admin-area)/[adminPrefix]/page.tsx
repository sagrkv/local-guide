"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface DashboardData {
  cities: { total: number; published: number; draft: number };
  pois: { total: number; published: number; approved: number; underReview: number; aiSuggested: number };
  itineraries: number;
  collections: number;
  recentPOIs: any[];
  recentCities: any[];
}

export default function AdminDashboardPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cities and aggregate stats
        const citiesRes = await apiClient.getCities({ limit: 100 });
        const cities = citiesRes.data ?? [];

        const cityStats = {
          total: cities.length,
          published: cities.filter((c: any) => c.status === "PUBLISHED").length,
          draft: cities.filter((c: any) => c.status === "DRAFT").length,
        };

        // Aggregate POI stats across all cities
        let poisTotal = 0;
        let poisPublished = 0;
        let poisApproved = 0;
        let poisReview = 0;
        let poisSuggested = 0;
        let itinerariesTotal = 0;
        let collectionsTotal = 0;

        for (const city of cities) {
          const count = city._count ?? {};
          poisTotal += count.pois ?? 0;
          itinerariesTotal += count.itineraries ?? 0;
          collectionsTotal += count.collections ?? 0;
        }

        // Try to get POI stats from first few cities
        const publishedCities = cities.filter((c: any) => c.status === "PUBLISHED" || c.status === "DRAFT").slice(0, 5);
        for (const city of publishedCities) {
          try {
            const statsRes = await apiClient.getCityPOIStats(city.id);
            const s = statsRes.data ?? {};
            poisPublished += s.PUBLISHED ?? 0;
            poisApproved += s.APPROVED ?? 0;
            poisReview += s.UNDER_REVIEW ?? 0;
            poisSuggested += s.AI_SUGGESTED ?? 0;
          } catch {
            // Skip if stats endpoint fails
          }
        }

        setData({
          cities: cityStats,
          pois: {
            total: poisTotal,
            published: poisPublished,
            approved: poisApproved,
            underReview: poisReview,
            aiSuggested: poisSuggested,
          },
          itineraries: itinerariesTotal,
          collections: collectionsTotal,
          recentCities: cities.slice(0, 5),
          recentPOIs: [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 text-[13px]">Overview of your Local Guide platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Cities"
          value={data?.cities.total ?? 0}
          sub={`${data?.cities.published ?? 0} published, ${data?.cities.draft ?? 0} draft`}
        />
        <StatCard
          label="Total POIs"
          value={data?.pois.total ?? 0}
          sub={`${data?.pois.published ?? 0} published`}
        />
        <StatCard
          label="Itineraries"
          value={data?.itineraries ?? 0}
        />
        <StatCard
          label="Collections"
          value={data?.collections ?? 0}
        />
      </div>

      {/* POI Pipeline */}
      {data && (data.pois.aiSuggested > 0 || data.pois.underReview > 0 || data.pois.approved > 0) && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
          <h2 className="text-sm font-medium text-gray-200 mb-3">POI Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="h-1.5 rounded-full bg-blue-500 mb-2" />
              <p className="text-lg font-semibold text-gray-100">{data.pois.aiSuggested}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">AI Suggested</p>
            </div>
            <div className="text-center">
              <div className="h-1.5 rounded-full bg-amber-500 mb-2" />
              <p className="text-lg font-semibold text-gray-100">{data.pois.underReview}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Under Review</p>
            </div>
            <div className="text-center">
              <div className="h-1.5 rounded-full bg-emerald-500 mb-2" />
              <p className="text-lg font-semibold text-gray-100">{data.pois.approved}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Approved</p>
            </div>
            <div className="text-center">
              <div className="h-1.5 rounded-full bg-emerald-400 mb-2" />
              <p className="text-lg font-semibold text-gray-100">{data.pois.published}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Published</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Cities */}
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-200">Recent Cities</h2>
            <Link
              href={`/${adminPrefix}/cities`}
              className="text-[13px] text-accent hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.recentCities ?? []).length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-[13px]">No cities yet</p>
            ) : (
              (data?.recentCities ?? []).map((city: any) => (
                <Link
                  key={city.id}
                  href={`/${adminPrefix}/cities/${city.id}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/30 transition-colors"
                >
                  <div>
                    <p className="text-[13px] text-gray-200">{city.name}</p>
                    {city.tagline && (
                      <p className="text-xs text-gray-500">{city.tagline}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                      city.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : city.status === "ARCHIVED"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {city.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
          <h2 className="text-sm font-medium text-gray-200 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/${adminPrefix}/cities/new`}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <p className="text-[13px] font-medium text-gray-200">Add City</p>
              <p className="text-xs text-gray-500 mt-0.5">Create a new city</p>
            </Link>
            <Link
              href={`/${adminPrefix}/cities`}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <p className="text-[13px] font-medium text-gray-200">View Cities</p>
              <p className="text-xs text-gray-500 mt-0.5">Manage all cities</p>
            </Link>
            <Link
              href={`/${adminPrefix}/categories`}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <p className="text-[13px] font-medium text-gray-200">Categories</p>
              <p className="text-xs text-gray-500 mt-0.5">Manage POI categories</p>
            </Link>
            <Link
              href={`/${adminPrefix}/tags`}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <p className="text-[13px] font-medium text-gray-200">Tags</p>
              <p className="text-xs text-gray-500 mt-0.5">Manage POI tags</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
      <div className="text-xs font-medium text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-100">{value.toLocaleString()}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
