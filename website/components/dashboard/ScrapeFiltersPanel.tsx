"use client";

import { motion } from "framer-motion";

/**
 * Pre-scrape filter criteria for lead filtering.
 * Users only pay credits for leads matching these criteria.
 */
export interface ScrapeFilters {
  /** Target number of leads to scrape */
  targetLeads: number;
  /** Filter by phone presence (true = must have, false = must not have, undefined = any) */
  hasPhone?: boolean;
  /** Filter by website presence (true = must have, false = must not have, undefined = any) */
  hasWebsite?: boolean;
  /** Filter by email presence (true = must have, false = must not have, undefined = any) */
  hasEmail?: boolean;
  /** Minimum Google rating (1-5 stars) */
  minRating?: number;
  /** Minimum number of Google reviews */
  minReviews?: number;
  /** Only include open/active businesses */
  onlyOpenBusinesses: boolean;
}

interface ScrapeFiltersPanelProps {
  filters: ScrapeFilters;
  onChange: (filters: ScrapeFilters) => void;
  disabled?: boolean;
}

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

export function ScrapeFiltersPanel({
  filters,
  onChange,
  disabled = false
}: ScrapeFiltersPanelProps) {
  const creditCost = filters.targetLeads;

  const handleCheckboxChange = (
    field: keyof Pick<ScrapeFilters, "hasPhone" | "hasWebsite" | "hasEmail" | "onlyOpenBusinesses">,
    checked: boolean
  ) => {
    if (field === "onlyOpenBusinesses") {
      onChange({ ...filters, [field]: checked });
      return;
    }

    // For boolean filters, cycle through: undefined -> true -> false -> undefined
    // But for simplicity, we use: unchecked = undefined, checked = true
    onChange({ ...filters, [field]: checked ? true : undefined });
  };

  const handleNoWebsiteChange = (checked: boolean) => {
    // "No website" means hasWebsite = false
    // This is mutually exclusive with "Must have website"
    if (checked) {
      onChange({ ...filters, hasWebsite: false });
    } else {
      onChange({ ...filters, hasWebsite: undefined });
    }
  };

  const handleHasWebsiteChange = (checked: boolean) => {
    // "Must have website" means hasWebsite = true
    // This is mutually exclusive with "No website"
    if (checked) {
      onChange({ ...filters, hasWebsite: true });
    } else {
      onChange({ ...filters, hasWebsite: undefined });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-white">Lead Filters</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Only pay for leads matching your criteria
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Target Leads Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            I want
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1000}
              value={filters.targetLeads}
              onChange={(e) => {
                const value = Math.max(1, Math.min(1000, parseInt(e.target.value) || 1));
                onChange({ ...filters, targetLeads: value });
              }}
              disabled={disabled}
              className="w-24 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-center font-medium focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-400 text-sm">leads</span>
          </div>
        </div>

        {/* Contact Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Contact Information
          </label>
          <div className="space-y-2.5">
            <CheckboxItem
              checked={filters.hasPhone === true}
              onChange={(checked) => handleCheckboxChange("hasPhone", checked)}
              disabled={disabled}
              label="Must have phone number"
            />
            <CheckboxItem
              checked={filters.hasWebsite === true}
              onChange={handleHasWebsiteChange}
              disabled={disabled || filters.hasWebsite === false}
              label="Must have website"
            />
            <CheckboxItem
              checked={filters.hasEmail === true}
              onChange={(checked) => handleCheckboxChange("hasEmail", checked)}
              disabled={disabled}
              label="Must have email"
            />
          </div>
        </div>

        {/* Web Dev Leads Section */}
        <div className="pt-3 border-t border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            For Web Dev Leads
          </label>
          <CheckboxItem
            checked={filters.hasWebsite === false}
            onChange={handleNoWebsiteChange}
            disabled={disabled || filters.hasWebsite === true}
            label="NO website (needs web services)"
            accent
          />
        </div>

        {/* Rating Filters */}
        <div className="pt-3 border-t border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Quality Filters
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Min Rating
              </label>
              <select
                value={filters.minRating?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  onChange({ ...filters, minRating: value });
                }}
                disabled={disabled}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Min Reviews
              </label>
              <select
                value={filters.minReviews?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange({ ...filters, minReviews: value });
                }}
                disabled={disabled}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
              >
                {REVIEW_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Business Status */}
        <div className="pt-3 border-t border-gray-700/50">
          <CheckboxItem
            checked={filters.onlyOpenBusinesses}
            onChange={(checked) => handleCheckboxChange("onlyOpenBusinesses", checked)}
            disabled={disabled}
            label="Only open/active businesses"
          />
        </div>

        {/* Cost Estimate */}
        <div className="pt-4 mt-4 border-t border-gray-700">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CoinIcon className="w-4 h-4 text-accent" />
                <span className="text-sm text-gray-400">Estimated cost</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">
                  {creditCost} <span className="text-sm font-normal text-gray-400">credits</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              1 credit per lead × {filters.targetLeads} leads
            </p>
          </div>
        </div>

        {/* Active Filters Summary */}
        {getActiveFiltersCount(filters) > 0 && (
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {getActiveFiltersCount(filters)} filter{getActiveFiltersCount(filters) > 1 ? "s" : ""} active
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper to count active filters (filters that are actively narrowing results)
function getActiveFiltersCount(filters: ScrapeFilters): number {
  let count = 0;
  if (filters.hasPhone !== undefined) count++;
  if (filters.hasWebsite !== undefined) count++;
  if (filters.hasEmail !== undefined) count++;
  if (filters.minRating !== undefined) count++;
  if (filters.minReviews !== undefined) count++;
  if (filters.onlyOpenBusinesses) count++; // Count when actively filtering to open only
  return count;
}

// Checkbox component
function CheckboxItem({
  checked,
  onChange,
  disabled,
  label,
  accent = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  accent?: boolean;
}) {
  return (
    <label
      className={`
        flex items-center gap-3 cursor-pointer group
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
          ${checked
            ? accent
              ? "bg-emerald-500 border-emerald-500"
              : "bg-accent border-accent"
            : "bg-transparent border-gray-600 group-hover:border-gray-500"
          }
          ${disabled ? "" : "cursor-pointer"}
        `}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {checked && <CheckIcon className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm ${checked ? (accent ? "text-emerald-400" : "text-white") : "text-gray-400"}`}>
        {label}
      </span>
    </label>
  );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Export default filters
export function getDefaultScrapeFilters(): ScrapeFilters {
  return {
    targetLeads: 50,
    hasPhone: true,
    hasWebsite: undefined,
    hasEmail: undefined,
    minRating: undefined,
    minReviews: undefined,
    onlyOpenBusinesses: true,
  };
}
