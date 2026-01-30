"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapBounds, MapEstimate } from "@/components/dashboard/MapSelector";
import { getDefaultScrapeFilters, type ScrapeFilters } from "@/components/dashboard/ScrapeFiltersPanel";
import {
  BUSINESS_TYPE_CATEGORIES,
  UNIQUE_BUSINESS_TYPES,
  OTHER_BUSINESS_TYPE,
  findBusinessType,
  type BusinessType,
} from "@/lib/constants/business-types";

interface SavedRegion {
  id: string;
  name: string;
  southwestLat: number;
  southwestLng: number;
  northeastLat: number;
  northeastLng: number;
  lastUsed: string;
  timesUsed: number;
}

// Dynamic import for MapSelector (uses Leaflet which is SSR incompatible)
const MapSelector = dynamic(() => import("@/components/dashboard/MapSelector"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[400px] bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});


const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "3.0", label: "3.0+ stars" },
  { value: "3.5", label: "3.5+ stars" },
  { value: "4.0", label: "4.0+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

const REVIEW_OPTIONS = [
  { value: "", label: "Any" },
  { value: "5", label: "5+" },
  { value: "10", label: "10+" },
  { value: "25", label: "25+" },
  { value: "50", label: "50+" },
  { value: "100", label: "100+" },
];

export default function NewScrapePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessTypeSearch, setBusinessTypeSearch] = useState("");

  // Map state
  const [selectedBounds, setSelectedBounds] = useState<MapBounds | null>(null);
  const [mapEstimate, setMapEstimate] = useState<MapEstimate | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ScrapeFilters>(getDefaultScrapeFilters());

  // Saved regions state
  const [savedRegions, setSavedRegions] = useState<SavedRegion[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [showSavedRegionsDropdown, setShowSavedRegionsDropdown] = useState(false);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [showSaveRegionModal, setShowSaveRegionModal] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");

  // Expanded categories state (Popular expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["popular"]));

  const isCustomQuery = selectedType === "__other__";
  const selectedTypeData = selectedType && selectedType !== "__other__"
    ? findBusinessType(selectedType)
    : selectedType === "__other__"
      ? OTHER_BUSINESS_TYPE
      : undefined;

  // Filter business types by search - returns flat list when searching, categories otherwise
  const { filteredTypes, isSearching } = useMemo(() => {
    const searchTerm = businessTypeSearch.trim().toLowerCase();
    if (!searchTerm) {
      return { filteredTypes: null, isSearching: false };
    }
    const matches = UNIQUE_BUSINESS_TYPES.filter((t) =>
      t.label.toLowerCase().includes(searchTerm) ||
      t.value.toLowerCase().includes(searchTerm)
    );
    return { filteredTypes: matches, isSearching: true };
  }, [businessTypeSearch]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Ref for click-outside handling on saved regions dropdown
  const savedRegionsDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch saved regions on mount
  useEffect(() => {
    const fetchSavedRegions = async () => {
      try {
        const response = await apiClient.getRecentSavedRegions();
        setSavedRegions(response.regions);
      } catch {
        // Silent fail - just means no saved regions yet
      } finally {
        setIsLoadingRegions(false);
      }
    };
    fetchSavedRegions();
  }, []);

  // Click-outside handler for saved regions dropdown
  useEffect(() => {
    if (!showSavedRegionsDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        savedRegionsDropdownRef.current &&
        !savedRegionsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSavedRegionsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSavedRegionsDropdown]);

  // Handle selecting a saved region
  const handleSelectSavedRegion = useCallback(async (region: SavedRegion) => {
    const bounds: MapBounds = {
      sw: { lat: region.southwestLat, lng: region.southwestLng },
      ne: { lat: region.northeastLat, lng: region.northeastLng },
    };
    setSelectedBounds(bounds);
    setShowSavedRegionsDropdown(false);

    // Mark as used (fire and forget)
    try {
      await apiClient.markSavedRegionAsUsed(region.id);
    } catch {
      // Silent fail
    }

    toast.success(`Loaded region: ${region.name}`);
  }, []);

  // Handle saving current region
  const handleSaveRegion = async () => {
    if (!selectedBounds || !newRegionName.trim()) {
      return;
    }

    setIsSavingRegion(true);
    try {
      const saved = await apiClient.createSavedRegion({
        name: newRegionName.trim(),
        southwestLat: selectedBounds.sw.lat,
        southwestLng: selectedBounds.sw.lng,
        northeastLat: selectedBounds.ne.lat,
        northeastLng: selectedBounds.ne.lng,
      });

      setSavedRegions((prev) => [saved, ...prev]);
      setShowSaveRegionModal(false);
      setNewRegionName("");
      toast.success("Region saved!", {
        description: `"${saved.name}" added to your saved regions`,
      });
    } catch (error) {
      toast.error("Failed to save region", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSavingRegion(false);
    }
  };

  // Handle map bounds selection
  const handleBoundsSelected = useCallback((bounds: MapBounds | null) => {
    setSelectedBounds(bounds);
  }, []);

  // Handle map estimate update
  const handleEstimateUpdate = useCallback((estimate: MapEstimate | null) => {
    setMapEstimate(estimate);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = isCustomQuery ? customQuery.trim() : selectedType;

    if (!query) {
      toast.error(isCustomQuery ? "Please enter a business type" : "Please select a business type");
      return;
    }

    if (!selectedBounds) {
      toast.error("Please select an area on the map");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build API filters from UI filters
      const apiFilters: {
        hasWebsite?: boolean;
        hasEmail?: boolean;
        hasPhone?: boolean;
        minRating?: number;
        minReviews?: number;
      } = {};

      if (filters.hasWebsite !== undefined) {
        apiFilters.hasWebsite = filters.hasWebsite;
      }
      if (filters.hasEmail === true) {
        apiFilters.hasEmail = true;
      }
      if (filters.hasPhone === true) {
        apiFilters.hasPhone = true;
      }
      if (filters.minRating !== undefined) {
        apiFilters.minRating = filters.minRating;
      }
      if (filters.minReviews !== undefined) {
        apiFilters.minReviews = filters.minReviews;
      }

      await apiClient.createScrapeJobWithBounds({
        type: "DISCOVERY_PIPELINE", // Uses Google Places API for faster, more accurate results
        query,
        bounds: selectedBounds,
        category: selectedTypeData?.category || "OTHER",
        maxResults: filters.targetLeads,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
      });

      const filterSummary = buildFilterSummary(filters);

      toast.success("Scrape started!", {
        description: `Searching for ${query} in selected region${filterSummary ? ` (${filterSummary})` : ""}`,
      });

      // Redirect to scrape history page
      router.push("/dashboard/scrape");
    } catch (error) {
      toast.error("Failed to start scrape", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">New Scrape</h1>
          <p className="text-gray-400 text-sm mt-0.5">Find businesses that need your services</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/regions"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Manage Regions
          </Link>
          <Link
            href="/dashboard/scrape"
            className="text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to History
          </Link>
        </div>
      </div>

      {/* Three-Column Layout: Map (2 cols) + Controls (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Map Column - Spans 2 of 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0"
        >
          {/* Map Header with Saved Regions */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white">Select Region</span>
            </div>

            {/* Saved Regions Dropdown */}
            {!isLoadingRegions && savedRegions.length > 0 && (
              <div className="relative" ref={savedRegionsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSavedRegionsDropdown(!showSavedRegionsDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors"
                  aria-label="Open saved regions menu"
                  aria-expanded={showSavedRegionsDropdown}
                  aria-haspopup="listbox"
                >
                  <BookmarkIcon className="w-3.5 h-3.5" />
                  My Regions
                  <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showSavedRegionsDropdown ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showSavedRegionsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-[9999] overflow-hidden"
                    >
                      <div className="p-2 border-b border-gray-700">
                        <p className="text-xs text-gray-500 px-2">Recently used regions</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto" role="listbox" aria-label="Saved regions">
                        {savedRegions.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => handleSelectSavedRegion(region)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                                {region.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Used {region.timesUsed} time{region.timesUsed !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <MapPinIcon className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" />
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-700">
                        <Link
                          href="/dashboard/regions"
                          className="block w-full px-3 py-2 text-center text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          Manage all regions
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Map - Full Height */}
          <div className="flex-1 relative min-h-[350px]">
            <MapSelector
              onBoundsSelected={handleBoundsSelected}
              onEstimateUpdate={handleEstimateUpdate}
              externalBounds={selectedBounds}
            />
          </div>

          {/* Region Stats (shown when region selected) */}
          {mapEstimate && (
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Cells:</span>
                    <span className="text-sm font-medium text-white">{mapEstimate.cells}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Est. leads:</span>
                    <span className="text-sm font-medium text-accent">~{mapEstimate.estimatedLeads}</span>
                  </div>
                </div>
                {selectedBounds && (
                  <button
                    type="button"
                    onClick={() => setShowSaveRegionModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <BookmarkPlusIcon className="w-3.5 h-3.5" />
                    Save region
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Business Type Section */}
            <div className="p-4 border-b border-gray-700">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Business Type
              </label>

              {/* Search Input */}
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={businessTypeSearch}
                  onChange={(e) => setBusinessTypeSearch(e.target.value)}
                  placeholder="Search types..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all"
                />
                {businessTypeSearch && (
                  <button
                    type="button"
                    onClick={() => setBusinessTypeSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Business Type List */}
              <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                {isSearching ? (
                  // Flat search results
                  filteredTypes && filteredTypes.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredTypes.map((type) => (
                        <BusinessTypeOption
                          key={type.value}
                          type={type}
                          isSelected={selectedType === type.value}
                          onSelect={() => {
                            setSelectedType(type.value);
                            setCustomQuery("");
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No matching types</p>
                  )
                ) : (
                  // Categorized view with collapsible sections
                  <div className="space-y-1">
                    {BUSINESS_TYPE_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        {/* Category Header */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <ChevronRightIcon
                              className={`w-3.5 h-3.5 transition-transform ${
                                expandedCategories.has(category.id) ? "rotate-90" : ""
                              }`}
                            />
                            {category.label}
                          </span>
                          <span className="text-gray-600 text-[10px]">
                            {category.types.length}
                          </span>
                        </button>

                        {/* Category Types */}
                        <AnimatePresence>
                          {expandedCategories.has(category.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-0.5 pl-2">
                                {category.types.map((type) => (
                                  <BusinessTypeOption
                                    key={`${category.id}-${type.value}`}
                                    type={type}
                                    isSelected={selectedType === type.value}
                                    onSelect={() => {
                                      setSelectedType(type.value);
                                      setCustomQuery("");
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {/* Other Option - Always visible at bottom */}
                    <div className="pt-1 border-t border-gray-700/50 mt-1">
                      <BusinessTypeOption
                        type={OTHER_BUSINESS_TYPE}
                        isSelected={selectedType === "__other__"}
                        onSelect={() => setSelectedType("__other__")}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Query Input */}
              <AnimatePresence>
                {isCustomQuery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <input
                      type="text"
                      value={customQuery}
                      onChange={(e) => {
                        const sanitized = e.target.value
                          .slice(0, 100)
                          .replace(/[<>{}[\]\\]/g, "");
                        setCustomQuery(sanitized);
                      }}
                      placeholder="e.g., Pet shops, Furniture stores..."
                      className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all"
                      maxLength={100}
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filters Section - Inline */}
            <div className="p-4 border-b border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Filters</span>
              </div>

              {/* Contact Filters - 2 column grid */}
              <div className="grid grid-cols-2 gap-2">
                <InlineCheckbox
                  checked={filters.hasPhone === true}
                  onChange={(checked) => setFilters({ ...filters, hasPhone: checked ? true : undefined })}
                  label="Has phone"
                  disabled={isSubmitting}
                />
                <InlineCheckbox
                  checked={filters.hasWebsite === true}
                  onChange={(checked) => setFilters({ ...filters, hasWebsite: checked ? true : undefined })}
                  label="Has website"
                  disabled={isSubmitting || filters.hasWebsite === false}
                />
                <InlineCheckbox
                  checked={filters.hasEmail === true}
                  onChange={(checked) => setFilters({ ...filters, hasEmail: checked ? true : undefined })}
                  label="Has email"
                  disabled={isSubmitting}
                />
                <InlineCheckbox
                  checked={filters.hasWebsite === false}
                  onChange={(checked) => setFilters({ ...filters, hasWebsite: checked ? false : undefined })}
                  label="No website"
                  accent
                  disabled={isSubmitting || filters.hasWebsite === true}
                />
              </div>

              {/* Rating/Reviews - 2 column grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rating</label>
                  <select
                    value={filters.minRating?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFilters({ ...filters, minRating: value });
                    }}
                    disabled={isSubmitting}
                    className="w-full px-2.5 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-accent/50 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reviews</label>
                  <select
                    value={filters.minReviews?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setFilters({ ...filters, minReviews: value });
                    }}
                    disabled={isSubmitting}
                    className="w-full px-2.5 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-accent/50 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    {REVIEW_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Section - Sticky at bottom */}
            <div className="mt-auto p-4 bg-gray-800/80">
              {/* Target Leads */}
              <div className="flex items-center gap-2 mb-4">
                <label className="text-xs text-gray-400">Target:</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={filters.targetLeads}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(1000, parseInt(e.target.value) || 1));
                    setFilters({ ...filters, targetLeads: value });
                  }}
                  disabled={isSubmitting}
                  className="w-20 px-2.5 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm text-center font-medium focus:outline-none focus:border-accent/50 transition-all disabled:opacity-50"
                />
                <span className="text-xs text-gray-500">leads</span>
              </div>

              {/* Start Scrape Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (!isCustomQuery && !selectedType) ||
                  (isCustomQuery && !customQuery.trim()) ||
                  !selectedBounds
                }
                className="w-full py-3 bg-accent hover:bg-accent-light disabled:bg-gray-700 disabled:text-gray-500 text-background font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    Starting...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4" />
                    Start Scrape
                  </>
                )}
              </button>

              {/* Credit info */}
              <p className="text-xs text-gray-500 mt-2 text-center">
                1 credit per lead · {filters.targetLeads} credits max
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Save Region Modal */}
      <AnimatePresence>
        {showSaveRegionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] p-4"
            onClick={() => setShowSaveRegionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Save Region</h3>
              <p className="text-sm text-gray-400 mb-4">
                Save this region for quick access later when starting new scrapes.
              </p>

              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="Region name (e.g., Downtown Bangalore)"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRegionName.trim()) {
                    handleSaveRegion();
                  }
                }}
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveRegionModal(false)}
                  className="flex-1 py-2.5 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRegion}
                  disabled={!newRegionName.trim() || isSavingRegion}
                  className="flex-1 py-2.5 bg-accent hover:bg-accent-light disabled:bg-gray-700 disabled:text-gray-500 text-background font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingRegion ? (
                    <>
                      <LoadingSpinner className="w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    "Save Region"
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

// Business Type Option Component
function BusinessTypeOption({
  type,
  isSelected,
  onSelect,
}: {
  type: BusinessType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`
        flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all
        ${isSelected
          ? "bg-accent/10 border border-accent/30"
          : "hover:bg-gray-700/50 border border-transparent"
        }
      `}
    >
      <input
        type="radio"
        name="businessType"
        value={type.value}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />
      <div
        className={`
          w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
          ${isSelected ? "border-accent bg-accent" : "border-gray-500"}
        `}
      >
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-background" />
        )}
      </div>
      <BusinessIcon type={type.icon || "sparkles"} className="w-3.5 h-3.5 text-gray-500" />
      <span className={`text-sm truncate ${isSelected ? "text-accent font-medium" : "text-gray-300"}`}>
        {type.label}
      </span>
    </label>
  );
}

// Inline Checkbox Component for filters
function InlineCheckbox({
  checked,
  onChange,
  label,
  accent = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={`
        flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700/30"}
        ${checked ? (accent ? "bg-emerald-500/10" : "bg-accent/10") : ""}
      `}
    >
      <div
        className={`
          w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
          ${checked
            ? accent
              ? "bg-emerald-500 border-emerald-500"
              : "bg-accent border-accent"
            : "bg-transparent border-gray-600"
          }
        `}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {checked && <CheckIcon className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className={`${checked ? (accent ? "text-emerald-400" : "text-accent") : "text-gray-400"}`}>
        {label}
      </span>
    </label>
  );
}

// Helper to build filter summary for toast
function buildFilterSummary(filters: ScrapeFilters): string {
  const parts: string[] = [];

  if (filters.hasPhone === true) parts.push("with phone");
  if (filters.hasWebsite === true) parts.push("with website");
  if (filters.hasWebsite === false) parts.push("no website");
  if (filters.hasEmail === true) parts.push("with email");
  if (filters.minRating) parts.push(`${filters.minRating}+ stars`);
  if (filters.minReviews) parts.push(`${filters.minReviews}+ reviews`);

  return parts.join(", ");
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function BookmarkPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v4m-2-2h4" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

function BusinessIcon({ type, className }: { type: string; className?: string }) {
  const iconPaths: Record<string, React.ReactNode> = {
    hospital: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    tooth: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c2 0 4 1 4 4 0 2-1 3-1 6 0 2-1 6-3 6s-3-4-3-6c0-3-1-4-1-6 0-3 2-4 4-4z" />,
    scissors: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />,
    dumbbell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h2m12 0h2M4 17h2m12 0h2M6 7v10m12-10v10M8 7h8M8 17h8" />,
    hotel: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    utensils: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18m0-6h3m-3-6h3a3 3 0 010 6H3m18-12v18m0-18c-3 0-6 2-6 6v12" />,
    factory: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21H5a2 2 0 01-2-2V9l4-4v3l4-4v3l4-4v3l6 3v13a2 2 0 01-2 2z" />,
    shop: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18l-1 9H4L3 3zm0 9v9a2 2 0 002 2h14a2 2 0 002-2v-9M10 21v-6h4v6" />,
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    rocket: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m6 6a14.98 14.98 0 01-5.84 7.38m0 0a6 6 0 01-8.16-5.64l.54-2.72a6 6 0 013.6-4.72L9.63 8.4" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {iconPaths[type] || iconPaths.sparkles}
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}
