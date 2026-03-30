"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, CityReadiness } from "@/lib/api-client";

interface City {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  status: string;
  state?: string;
  country?: string;
  _count?: { pois: number; itineraries: number; collections: number };
}

interface ReadinessItem {
  done: boolean;
  current?: number;
  required?: number;
  total?: number;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400",
  ARCHIVED: "bg-red-500/10 text-red-400",
};

export default function CityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [city, setCity] = useState<City | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [readiness, setReadiness] = useState<CityReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchReadiness = async () => {
    try {
      const res = await apiClient.getCityReadiness(cityId);
      setReadiness(res.data);
    } catch {
      // Non-critical — page still works without readiness
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cityRes, statsRes] = await Promise.allSettled([
          apiClient.getCityBySlug(cityId),
          apiClient.getCityPOIStats(cityId),
        ]);

        if (cityRes.status === "fulfilled") {
          setCity(cityRes.value.data);
        } else {
          setError("Failed to load city");
        }

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load city");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchReadiness();
  }, [cityId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!city) return;
    try {
      setStatusUpdating(true);
      const res = await apiClient.updateCityStatus(cityId, newStatus);
      setCity(res.data);
      fetchReadiness();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {error || "City not found"}
        </div>
        <Link href={`/${adminPrefix}/cities`} className="text-[13px] text-gray-400 hover:text-white">
          Back to Cities
        </Link>
      </div>
    );
  }

  const subNavItems = [
    { label: "Edit Details", href: `/${adminPrefix}/cities/${cityId}/edit` },
    { label: "Theme", href: `/${adminPrefix}/cities/${cityId}/theme` },
    { label: "POIs", href: `/${adminPrefix}/cities/${cityId}/pois` },
    { label: "Review Queue", href: `/${adminPrefix}/cities/${cityId}/review` },
    { label: "Itineraries", href: `/${adminPrefix}/cities/${cityId}/itineraries` },
    { label: "Collections", href: `/${adminPrefix}/cities/${cityId}/collections` },
    { label: "AI Discovery", href: `/${adminPrefix}/cities/${cityId}/discover` },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">
          Cities
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-gray-200">{city.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{city.name}</h1>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[city.status] ?? STATUS_STYLES.DRAFT}`}
            >
              {city.status}
            </span>
          </div>
          {city.tagline && (
            <p className="text-[13px] text-gray-400 mt-0.5">{city.tagline}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/explore/${city.slug}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-3 inline-flex items-center gap-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] font-medium transition-colors"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            Preview as Public
          </a>
          {city.status === "DRAFT" && (
            <button
              onClick={() => handleStatusChange("PUBLISHED")}
              disabled={statusUpdating || (readiness !== null && !readiness.canPublish)}
              title={readiness && !readiness.canPublish ? "Complete all essential items before publishing" : undefined}
              className="h-7 px-3 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish
            </button>
          )}
          {city.status === "PUBLISHED" && (
            <button
              onClick={() => handleStatusChange("ARCHIVED")}
              disabled={statusUpdating}
              className="h-7 px-3 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              Archive
            </button>
          )}
          {city.status === "ARCHIVED" && (
            <button
              onClick={() => handleStatusChange("DRAFT")}
              disabled={statusUpdating}
              className="h-7 px-3 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors disabled:opacity-50"
            >
              Move to Draft
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1">
        {subNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="h-8 px-3 inline-flex items-center rounded-md text-[13px] text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Launch Readiness */}
      {readiness && <LaunchReadiness readiness={readiness} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total POIs" value={city._count?.pois ?? 0} />
        <StatCard label="Itineraries" value={city._count?.itineraries ?? 0} />
        <StatCard label="Collections" value={city._count?.collections ?? 0} />
        {stats && (
          <StatCard
            label="Published POIs"
            value={stats.PUBLISHED ?? 0}
          />
        )}
      </div>

      {/* POI Pipeline Stats */}
      {stats && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
          <h2 className="text-sm font-medium text-gray-200 mb-3">POI Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["AI_SUGGESTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"].map((status) => (
              <div key={status} className="text-center">
                <p className="text-lg font-semibold text-gray-100">
                  {stats[status] ?? 0}
                </p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-0.5">
                  {status.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City Info */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
        <h2 className="text-sm font-medium text-gray-200 mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          <div>
            <span className="text-gray-500">Slug:</span>{" "}
            <span className="text-gray-300">{city.slug}</span>
          </div>
          {city.state && (
            <div>
              <span className="text-gray-500">State:</span>{" "}
              <span className="text-gray-300">{city.state}</span>
            </div>
          )}
          {city.country && (
            <div>
              <span className="text-gray-500">Country:</span>{" "}
              <span className="text-gray-300">{city.country}</span>
            </div>
          )}
        </div>
        {city.description && (
          <p className="text-[13px] text-gray-400 mt-3 border-t border-gray-800/50 pt-3">
            {city.description}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 p-3">
      <div className="text-xs font-medium text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-100">{value}</div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ==================== Launch Readiness ====================

const ESSENTIAL_LABELS: Record<string, string> = {
  cityCreated: "City created",
  themeDefined: "Theme defined",
  minPOIs: "Minimum 30 published POIs",
  minCategories: "At least 3 different categories",
  poisHaveDescription: "All published POIs have descriptions",
  poisHaveCoordinates: "All published POIs have coordinates",
  minItineraries: "At least 1 published itinerary",
  minMoods: "At least 3 mood collections",
  taglineWritten: "City tagline written",
};

const RECOMMENDED_LABELS: Record<string, string> = {
  fiftyPOIs: "50+ published POIs",
  dayTrip: "Day trip collection",
  localsWeek: "Locals week collection",
  poisWithTips: "10+ POIs with local tips",
  poisWithPhotos: "10+ POIs with photos",
  multipleItineraries: "2+ published itineraries",
};

function LaunchReadiness({ readiness }: { readiness: CityReadiness }) {
  const [essentialOpen, setEssentialOpen] = useState(true);
  const [recommendedOpen, setRecommendedOpen] = useState(false);

  const essentialDone = Object.values(readiness.essential).filter((i) => i.done).length;
  const essentialTotal = Object.values(readiness.essential).length;
  const recommendedDone = Object.values(readiness.recommended).filter((i) => i.done).length;
  const recommendedTotal = Object.values(readiness.recommended).length;

  const barColor = readiness.score === 100
    ? "bg-emerald-500"
    : readiness.score >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
      {/* Progress header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-200">Launch Readiness</h2>
          <span className="text-[13px] font-semibold text-gray-300">{readiness.score}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>
        {readiness.canPublish ? (
          <p className="text-[11px] text-emerald-400 mt-1.5">Ready to publish</p>
        ) : (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Complete all essential items to enable publishing
          </p>
        )}
      </div>

      {/* Essential section */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setEssentialOpen(!essentialOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${essentialOpen ? "" : "-rotate-90"}`} />
            <span className="text-[13px] font-medium text-gray-300">Essential</span>
          </div>
          <span className="text-[11px] text-gray-500">
            {essentialDone}/{essentialTotal}
          </span>
        </button>
        {essentialOpen && (
          <div className="px-4 pb-3 space-y-1">
            {Object.entries(readiness.essential).map(([key, item]) => (
              <ChecklistRow
                key={key}
                label={ESSENTIAL_LABELS[key] ?? key}
                item={item}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommended section */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setRecommendedOpen(!recommendedOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${recommendedOpen ? "" : "-rotate-90"}`} />
            <span className="text-[13px] font-medium text-gray-300">Recommended</span>
          </div>
          <span className="text-[11px] text-gray-500">
            {recommendedDone}/{recommendedTotal}
          </span>
        </button>
        {recommendedOpen && (
          <div className="px-4 pb-3 space-y-1">
            {Object.entries(readiness.recommended).map(([key, item]) => (
              <ChecklistRow
                key={key}
                label={RECOMMENDED_LABELS[key] ?? key}
                item={item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({ label, item }: { label: string; item: ReadinessItem }) {
  const progress = formatProgress(item);

  return (
    <div className="flex items-center gap-2 py-1">
      {item.done ? (
        <CheckIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      ) : (
        <XIcon className="h-3.5 w-3.5 text-red-400 shrink-0" />
      )}
      <span className={`text-[13px] ${item.done ? "text-gray-400" : "text-gray-300"}`}>
        {label}
      </span>
      {progress && (
        <span className={`ml-auto text-[11px] tabular-nums ${item.done ? "text-gray-600" : "text-gray-500"}`}>
          {progress}
        </span>
      )}
    </div>
  );
}

function formatProgress(item: ReadinessItem): string | null {
  if (item.current !== undefined && item.required !== undefined) {
    return `${item.current}/${item.required}`;
  }
  if (item.current !== undefined && item.total !== undefined) {
    return `${item.current}/${item.total}`;
  }
  return null;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
