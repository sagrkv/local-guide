"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface Lead {
  id: string;
  businessName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  stage: string;
  priority: string;
  score: number;
  category: string;
  hasWebsite: boolean;
  createdAt: string;
  tags: { id: string; name: string; color: string }[];
}

const STAGES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "CLOSED",
];

const STAGE_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  NEW: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  CONTACTED: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  INTERESTED: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
  },
  CLOSED: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-500",
};

const CATEGORIES = [
  "STARTUP",
  "RESTAURANT",
  "HOTEL",
  "ECOMMERCE",
  "SALON",
  "CLINIC",
  "GYM",
  "RETAIL",
  "EDUCATION",
  "REAL_ESTATE",
  "AGENCY",
  "OTHER",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function LeadsPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [hasWebsite, setHasWebsite] = useState<string>("");
  const [minScore, setMinScore] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Get unique cities from leads for filter dropdown
  const cities = [
    ...new Set(leads.map((l) => l.city).filter((c): c is string => Boolean(c))),
  ].sort();

  const fetchLeads = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 200 };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStage) params.stage = selectedStage;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedCity) params.city = selectedCity;
      if (hasWebsite) params.hasWebsite = hasWebsite;
      if (minScore) params.minScore = parseInt(minScore);
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const data = await apiClient.getLeads(params);
      setLeads(data.data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedStage,
    selectedPriority,
    selectedCity,
    hasWebsite,
    minScore,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStage("");
    setSelectedPriority("");
    setSelectedCity("");
    setHasWebsite("");
    setMinScore("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const activeFilterCount = [
    selectedCategory,
    selectedStage,
    selectedPriority,
    selectedCity,
    hasWebsite,
    minScore,
  ].filter(Boolean).length;

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!draggedLead || draggedLead.stage === stage) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLead.id ? { ...l, stage } : l)),
    );

    try {
      await apiClient.changeLeadStage(draggedLead.id, stage);
    } catch (error) {
      console.error("Failed to update lead stage:", error);
      fetchLeads(); // Revert on error
    }

    setDraggedLead(null);
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-gray-400 text-sm">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Search and Filter Toggle */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-accent w-full sm:w-56"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 px-3 border rounded-lg flex items-center gap-1.5 text-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-accent/20 border-accent text-accent"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            <FilterIcon className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-accent text-black text-[11px] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {/* Stage Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Has Website Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Website
                </label>
                <select
                  value={hasWebsite}
                  onChange={(e) => setHasWebsite(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Min Score Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Min Score
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                  <option value="score">Score</option>
                  <option value="businessName">Name</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full h-8 px-2 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                <div
                  className={`rounded-t-lg px-4 py-3 ${STAGE_COLORS[stage].bg} border-b ${STAGE_COLORS[stage].border}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${STAGE_COLORS[stage].text}`}>
                      {stage.replace("_", " ")}
                    </h3>
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                      {getLeadsByStage(stage).length}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-b-lg p-2 min-h-[400px] border border-gray-700 border-t-0">
                  <div className="space-y-2">
                    {getLeadsByStage(stage).map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => handleDragStart(lead)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/${adminPrefix}/leads/${lead.id}`}
                      className="text-[13px] font-medium text-white hover:text-accent transition-colors"
                    >
                      {lead.businessName}
                    </Link>
                    {lead.city && (
                      <p className="text-xs text-gray-400">{lead.city}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {lead.contactPerson && (
                      <p className="text-[13px] text-white">{lead.contactPerson}</p>
                    )}
                    {lead.email && (
                      <p className="text-xs text-gray-400">{lead.email}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[lead.stage].bg} ${STAGE_COLORS[lead.stage].text}`}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-gray-400">
                      {lead.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onDragStart,
}: {
  lead: Lead;
  onDragStart: () => void;
}) {
  return (
    <Link
      href={`/${adminPrefix}/leads/${lead.id}`}
      draggable
      onDragStart={onDragStart}
      className="block bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white text-sm leading-tight">
          {lead.businessName}
        </h4>
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[lead.priority]}`}
          title={lead.priority}
        />
      </div>

      {lead.city && <p className="text-xs text-gray-400 mb-2">{lead.city}</p>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {!lead.hasWebsite && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
              No site
            </span>
          )}
          {lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 text-xs rounded"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ScoreIcon className="w-3 h-3" />
          {lead.score}
        </div>
      </div>
    </Link>
  );
}

function ScoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}
