"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

interface SavedRegion {
  id: string;
  name: string;
  southwestLat: number;
  southwestLng: number;
  northeastLat: number;
  northeastLng: number;
  lastUsed: string;
  timesUsed: number;
  createdAt: string;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<SavedRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRegion, setEditingRegion] = useState<SavedRegion | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await apiClient.getSavedRegions({
        sortBy: "lastUsed",
        sortOrder: "desc",
      });
      setRegions(response.regions);
    } catch (error) {
      toast.error("Failed to load saved regions", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleStartEdit = (region: SavedRegion) => {
    setEditingRegion(region);
    setEditName(region.name);
  };

  const handleSaveEdit = async () => {
    if (!editingRegion || !editName.trim()) return;

    setIsSaving(true);
    try {
      const updated = await apiClient.updateSavedRegion(editingRegion.id, {
        name: editName.trim(),
      });
      setRegions((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setEditingRegion(null);
      setEditName("");
      toast.success("Region renamed");
    } catch (error) {
      toast.error("Failed to rename region", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRegion(null);
    setEditName("");
  };

  const handleDelete = async () => {
    if (!deletingRegionId) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteSavedRegion(deletingRegionId);
      setRegions((prev) => prev.filter((r) => r.id !== deletingRegionId));
      setDeletingRegionId(null);
      toast.success("Region deleted");
    } catch (error) {
      toast.error("Failed to delete region", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateArea = (region: SavedRegion): number => {
    const EARTH_RADIUS_KM = 6371;
    const latDiff = Math.abs(region.northeastLat - region.southwestLat);
    const lngDiff = Math.abs(region.northeastLng - region.southwestLng);
    const avgLat = (region.northeastLat + region.southwestLat) / 2;

    const latKm = latDiff * (Math.PI / 180) * EARTH_RADIUS_KM;
    const lngKm = lngDiff * (Math.PI / 180) * EARTH_RADIUS_KM * Math.cos((avgLat * Math.PI) / 180);

    return Math.round(latKm * lngKm);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Saved Regions</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage your saved map regions for quick scraping</p>
        </div>
        <Link
          href="/dashboard/scrape"
          className="h-8 px-3 bg-accent hover:bg-[#FF8C40] text-background text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Scrape
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner className="w-6 h-6 text-accent" />
        </div>
      ) : regions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-800 rounded-lg bg-gray-900 p-8 text-center"
        >
          <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <MapIcon className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No saved regions yet</h3>
          <p className="text-[13px] text-gray-400 mb-4 max-w-sm mx-auto">
            Save regions while creating scrapes to quickly reuse them later.
          </p>
          <Link
            href="/dashboard/scrape"
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-accent hover:bg-[#FF8C40] text-background text-[13px] font-medium rounded-md transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Create a Scrape
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {regions.map((region, index) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden group hover:border-gray-700 transition-colors"
            >
              {/* Region Preview */}
              <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPinIcon className="w-8 h-8 text-gray-700" />
                </div>
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-gray-400">
                  ~{calculateArea(region)} km²
                </div>
              </div>

              {/* Region Info */}
              <div className="p-3">
                {editingRegion?.id === region.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded-md text-[13px] text-white focus:outline-none focus:border-accent/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 h-7 text-[11px] text-gray-400 hover:text-white border border-gray-700 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim() || isSaving}
                        className="flex-1 h-7 text-[11px] bg-accent hover:bg-[#FF8C40] text-background font-medium rounded-md transition-colors disabled:opacity-50"
                      >
                        {isSaving ? "..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-[13px] font-medium text-white truncate">{region.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                      <span>{region.timesUsed}x used</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span>{formatDate(region.lastUsed)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href="/dashboard/scrape"
                        className="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] text-accent hover:text-[#FF8C40] border border-accent/30 hover:border-accent/50 rounded-md transition-colors"
                      >
                        <SearchIcon className="w-3 h-3" />
                        Use
                      </Link>
                      <button
                        onClick={() => handleStartEdit(region)}
                        className="h-7 px-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-md transition-colors"
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeletingRegionId(region.id)}
                        className="h-7 px-2 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50 rounded-md transition-colors"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingRegionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
            onClick={() => setDeletingRegionId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <TrashIcon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white text-center mb-1">Delete Region?</h3>
              <p className="text-[13px] text-gray-400 text-center mb-4">
                This action cannot be undone. The region will be permanently removed.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingRegionId(null)}
                  className="flex-1 h-8 text-[13px] text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-8 text-[13px] bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner className="w-3.5 h-3.5" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
