"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface City {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  country?: string;
  state?: string;
  _count?: { pois: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400",
  ARCHIVED: "bg-red-500/10 text-red-400",
};

export default function CitiesListPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.getCities({
        status: statusFilter || undefined,
        limit: 100,
      });
      setCities(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cities");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cities</h1>
        <Link
          href={`/${adminPrefix}/cities/new`}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add City
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 w-[130px] rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <span className="text-[13px] text-gray-500">
          {cities.length} {cities.length === 1 ? "city" : "cities"}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && !error && cities.length === 0 && (
        <div className="border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-[13px]">No cities found.</p>
          <Link
            href={`/${adminPrefix}/cities/new`}
            className="text-accent hover:underline text-[13px] mt-2 inline-block"
          >
            Create your first city
          </Link>
        </div>
      )}

      {!loading && cities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cities.map((city) => (
            <div
              key={city.id}
              onClick={() => router.push(`/${adminPrefix}/cities/${city.id}`)}
              className="border border-gray-800 rounded-lg bg-gray-900 p-4 cursor-pointer hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="text-[13px] font-medium text-gray-100 truncate">
                    {city.name}
                  </h3>
                  {city.tagline && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {city.tagline}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0 ${STATUS_STYLES[city.status] ?? STATUS_STYLES.DRAFT}`}
                >
                  {city.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                {city.state && <span>{city.state}</span>}
                {city.country && <span>{city.country}</span>}
                <span className="ml-auto">
                  {city._count?.pois ?? 0} POIs
                </span>
              </div>
            </div>
          ))}
        </div>
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
