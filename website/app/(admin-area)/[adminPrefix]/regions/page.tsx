"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ScrapingRegion {
  id: string;
  name: string;
  cities: string[];
  state: string | null;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { scrapeJobs: number };
}

interface SavedRegion {
  id: string;
  userId: string;
  name: string;
  southwestLat: number;
  southwestLng: number;
  northeastLat: number;
  northeastLng: number;
  lastUsed: string;
  timesUsed: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

type Tab = "scraping-regions" | "saved-regions";

export default function RegionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scraping-regions");
  const [scrapingRegions, setScrapingRegions] = useState<ScrapingRegion[]>([]);
  const [savedRegions, setSavedRegions] = useState<SavedRegion[]>([]);
  const [loadingScrapingRegions, setLoadingScrapingRegions] = useState(true);
  const [loadingSavedRegions, setLoadingSavedRegions] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ScrapingRegion | null>(null);

  // Fetch scraping regions
  const fetchScrapingRegions = useCallback(async () => {
    try {
      setLoadingScrapingRegions(true);
      const data = await apiClient.getRegions();
      setScrapingRegions(data);
    } catch (error) {
      console.error("Failed to fetch scraping regions:", error);
      toast.error("Failed to load scraping regions");
    } finally {
      setLoadingScrapingRegions(false);
    }
  }, []);

  // Fetch saved regions (all users)
  const fetchSavedRegions = useCallback(async () => {
    try {
      setLoadingSavedRegions(true);
      const data = await apiClient.getAdminSavedRegions();
      setSavedRegions(data.regions);
    } catch (error) {
      console.error("Failed to fetch saved regions:", error);
      toast.error("Failed to load saved regions");
    } finally {
      setLoadingSavedRegions(false);
    }
  }, []);

  useEffect(() => {
    fetchScrapingRegions();
    fetchSavedRegions();
  }, [fetchScrapingRegions, fetchSavedRegions]);

  const handleToggleActive = async (region: ScrapingRegion) => {
    try {
      await apiClient.toggleRegion(region.id);
      setScrapingRegions((prev) =>
        prev.map((r) =>
          r.id === region.id ? { ...r, isActive: !r.isActive } : r
        )
      );
      toast.success(`Region ${region.isActive ? "disabled" : "enabled"}`);
    } catch (error) {
      console.error("Failed to toggle region:", error);
      toast.error("Failed to update region");
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this region?")) return;
    try {
      await apiClient.deleteRegion(id);
      setScrapingRegions((prev) => prev.filter((r) => r.id !== id));
      toast.success("Region deleted");
    } catch (error) {
      console.error("Failed to delete region:", error);
      toast.error("Failed to delete region");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Regions</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage scraping presets and view user-saved map regions
          </p>
        </div>
        {activeTab === "scraping-regions" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-zinc-900 rounded-lg font-medium hover:bg-emerald-400 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Region
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("scraping-regions")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "scraping-regions"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Scraping Regions
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-zinc-600/50">
            {scrapingRegions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("saved-regions")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "saved-regions"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          User Saved Regions
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-zinc-600/50">
            {savedRegions.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "scraping-regions" ? (
        <ScrapingRegionsTab
          regions={scrapingRegions}
          loading={loadingScrapingRegions}
          onToggle={handleToggleActive}
          onEdit={setEditingRegion}
          onDelete={handleDeleteRegion}
        />
      ) : (
        <SavedRegionsTab regions={savedRegions} loading={loadingSavedRegions} />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRegion) && (
        <RegionModal
          region={editingRegion}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRegion(null);
          }}
          onSave={async (data) => {
            try {
              if (editingRegion) {
                await apiClient.updateRegion(editingRegion.id, data);
                toast.success("Region updated");
              } else {
                await apiClient.createRegion(data);
                toast.success("Region created");
              }
              fetchScrapingRegions();
              setShowCreateModal(false);
              setEditingRegion(null);
            } catch (error) {
              console.error("Failed to save region:", error);
              toast.error("Failed to save region");
            }
          }}
        />
      )}
    </div>
  );
}

// Scraping Regions Tab
function ScrapingRegionsTab({
  regions,
  loading,
  onToggle,
  onEdit,
  onDelete,
}: {
  regions: ScrapingRegion[];
  loading: boolean;
  onToggle: (region: ScrapingRegion) => void;
  onEdit: (region: ScrapingRegion) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (regions.length === 0) {
    return (
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-12 text-center">
        <div className="w-12 h-12 bg-zinc-700/30 rounded-xl flex items-center justify-center mx-auto mb-4">
          <MapIcon className="w-6 h-6 text-zinc-500" />
        </div>
        <p className="text-zinc-400 mb-2">No scraping regions configured</p>
        <p className="text-sm text-zinc-500">
          Create preset regions with city arrays for quick scraping
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-700/50 text-left text-sm text-zinc-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Cities</th>
            <th className="px-4 py-3 font-medium">State</th>
            <th className="px-4 py-3 font-medium">Scrape Jobs</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-700/30">
          {regions.map((region) => (
            <tr key={region.id} className="hover:bg-zinc-700/20 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium text-white">{region.name}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {region.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="px-2 py-0.5 bg-zinc-700/50 rounded text-xs text-zinc-300"
                    >
                      {city}
                    </span>
                  ))}
                  {region.cities.length > 3 && (
                    <span className="px-2 py-0.5 bg-zinc-600/50 rounded text-xs text-zinc-400">
                      +{region.cities.length - 3} more
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">
                {region.state || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">
                {region._count?.scrapeJobs || 0}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(region)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    region.isActive
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-zinc-600/30 text-zinc-500 hover:bg-zinc-600/50"
                  }`}
                >
                  {region.isActive ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(region)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                    title="Edit"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(region.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Saved Regions Tab
function SavedRegionsTab({
  regions,
  loading,
}: {
  regions: SavedRegion[];
  loading: boolean;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (regions.length === 0) {
    return (
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-12 text-center">
        <div className="w-12 h-12 bg-zinc-700/30 rounded-xl flex items-center justify-center mx-auto mb-4">
          <MapIcon className="w-6 h-6 text-zinc-500" />
        </div>
        <p className="text-zinc-400 mb-2">No saved regions yet</p>
        <p className="text-sm text-zinc-500">
          Users haven&apos;t saved any map regions yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-700/50 text-left text-sm text-zinc-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Bounds</th>
            <th className="px-4 py-3 font-medium">Times Used</th>
            <th className="px-4 py-3 font-medium">Last Used</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-700/30">
          {regions.map((region) => (
            <tr key={region.id} className="hover:bg-zinc-700/20 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium text-white">{region.name}</span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm text-white">{region.user?.name || "Unknown"}</p>
                  <p className="text-xs text-zinc-500">{region.user?.email || "-"}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-zinc-400 font-mono">
                  <p>SW: {region.southwestLat.toFixed(4)}, {region.southwestLng.toFixed(4)}</p>
                  <p>NE: {region.northeastLat.toFixed(4)}, {region.northeastLng.toFixed(4)}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-zinc-700/50 rounded text-sm text-zinc-300">
                  {region.timesUsed}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">
                {new Date(region.lastUsed).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">
                {new Date(region.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Region Modal for Create/Edit
function RegionModal({
  region,
  onClose,
  onSave,
}: {
  region: ScrapingRegion | null;
  onClose: () => void;
  onSave: (data: { name: string; cities: string[]; state?: string }) => void;
}) {
  const [name, setName] = useState(region?.name || "");
  const [cities, setCities] = useState(region?.cities.join(", ") || "");
  const [state, setState] = useState(region?.state || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const cityArray = cities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cityArray.length === 0) {
      toast.error("At least one city is required");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        cities: cityArray,
        state: state.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">
            {region ? "Edit Region" : "Create Region"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., South India"
              className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Cities * <span className="text-zinc-500 font-normal">(comma-separated)</span>
            </label>
            <textarea
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="Bangalore, Chennai, Hyderabad"
              rows={3}
              className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              State <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Karnataka"
              className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 text-zinc-900 rounded-lg font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : region ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-emerald-500/20 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
