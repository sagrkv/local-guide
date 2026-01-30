"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface Lead {
  id: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  category: string | null;
  stage: string;
  priority: string;
  score: number | null;
  lighthouseScore: number | null;
  hasWebsite: boolean;
  createdAt: string;
  tags?: { id: string; name: string; color: string }[];
  pendingRemindersCount?: number;
  nextReminder?: {
    id: string;
    remindAt: string;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STAGES = ["NEW", "CONTACTED", "INTERESTED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STAGE_CONFIG: Record<string, { bg: string; border: string; text: string; hoverBg: string; label: string }> = {
  NEW: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    hoverBg: "hover:bg-blue-500/20",
    label: "New",
  },
  CONTACTED: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    hoverBg: "hover:bg-amber-500/20",
    label: "Contacted",
  },
  INTERESTED: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    hoverBg: "hover:bg-purple-500/20",
    label: "Interested",
  },
  CLOSED: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    hoverBg: "hover:bg-emerald-500/20",
    label: "Closed",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-500",
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    stage: "",
    priority: "",
    category: "",
    search: "",
    page: 1,
    limit: 100,
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.stage) params.stage = filters.stage;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const data = await apiClient.getLeads(params);
      setLeads(data.data || []);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStageChange = async (leadId: string, newStage: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUpdatingStage(leadId);

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );

    try {
      await apiClient.changeLeadStage(leadId, newStage);
      toast.success(`Moved to ${STAGE_CONFIG[newStage].label}`);
    } catch {
      toast.error("Failed to update stage");
      fetchLeads();
    } finally {
      setUpdatingStage(null);
    }
  };

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

    await handleStageChange(draggedLead.id, stage);
    setDraggedLead(null);
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const handleLeadClick = (leadId: string) => {
    router.push(`/dashboard/leads/${leadId}`);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    }
  };

  const handleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleExport = () => {
    if (selectedLeads.size === 0) {
      toast.error("Please select leads to export");
      return;
    }

    const selectedData = leads.filter((l) => selectedLeads.has(l.id));
    const csv = [
      ["Business Name", "Email", "Phone", "Website", "City", "Category", "Stage", "Score"].join(","),
      ...selectedData.map((l) =>
        [l.businessName, l.email || "", l.phone || "", l.website || "", l.city || "", l.category || "", l.stage, l.score || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedLeads.size} leads`);
  };

  const hasActiveFilters = filters.search || filters.stage || filters.priority || filters.category;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {pagination ? `${pagination.total} total leads` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <KanbanIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {selectedLeads.size > 0 && (
            <button
              onClick={handleExport}
              className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <ExportIcon className="w-3.5 h-3.5" />
              Export ({selectedLeads.size})
            </button>
          )}
          <Link
            href="/dashboard/scrape"
            className="h-8 px-3 bg-accent hover:bg-[#FF8C40] text-background text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Find More
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full h-9 pl-9 pr-3 bg-gray-800/50 border border-gray-700 rounded-md text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Stage Filter - only for list view */}
        {viewMode === "list" && (
          <select
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value, page: 1 })}
            className="h-9 px-3 bg-gray-800/50 border border-gray-700 rounded-md text-[13px] text-white focus:outline-none focus:border-accent/50 transition-colors"
          >
            <option value="">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{STAGE_CONFIG[stage].label}</option>
            ))}
          </select>
        )}

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
          className="h-9 px-3 bg-gray-800/50 border border-gray-700 rounded-md text-[13px] text-white focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              setFilters({
                stage: "",
                priority: "",
                category: "",
                search: "",
                page: 1,
                limit: 100,
              })
            }
            className="text-[13px] text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState hasFilters={!!hasActiveFilters} />
      ) : viewMode === "kanban" ? (
        /* Kanban Board */
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column Header */}
                <div
                  className={`rounded-t-lg px-3 py-2.5 ${STAGE_CONFIG[stage].bg} border-b ${STAGE_CONFIG[stage].border}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[13px] font-medium ${STAGE_CONFIG[stage].text}`}>
                      {STAGE_CONFIG[stage].label}
                    </h3>
                    <span className="text-[11px] bg-gray-800/80 px-1.5 py-0.5 rounded-full text-gray-400">
                      {getLeadsByStage(stage).length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="bg-gray-900/50 rounded-b-lg p-2 min-h-[400px] border border-gray-800 border-t-0 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {getLeadsByStage(stage).map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => handleDragStart(lead)}
                        onClick={() => handleLeadClick(lead.id)}
                        onStageChange={handleStageChange}
                        isUpdating={updatingStage === lead.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="px-3 py-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-accent focus:ring-accent/50"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {leads.map((lead, index) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    index={index}
                    isSelected={selectedLeads.has(lead.id)}
                    onSelect={handleSelectLead}
                    onClick={() => handleLeadClick(lead.id)}
                    onStageChange={handleStageChange}
                    isUpdating={updatingStage === lead.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-3 py-2.5 border-t border-gray-800/50 flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={pagination.page === 1}
                  className="h-7 px-2.5 text-[11px] bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-md transition-colors"
                >
                  Previous
                </button>
                <span className="text-[11px] text-gray-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-7 px-2.5 text-[11px] bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-md transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onDragStart,
  onClick,
  onStageChange,
  isUpdating,
}: {
  lead: Lead;
  onDragStart: () => void;
  onClick: () => void;
  onStageChange: (id: string, stage: string, e?: React.MouseEvent) => void;
  isUpdating: boolean;
}) {
  const [showStageMenu, setShowStageMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer active:cursor-grabbing transition-all hover:shadow-lg hover:shadow-black/20 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white text-[13px] leading-tight group-hover:text-accent transition-colors">
          {lead.businessName}
        </h4>
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[lead.priority]}`}
          title={lead.priority}
        />
      </div>

      {/* City */}
      {lead.city && (
        <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1">
          <LocationIcon className="w-3 h-3" />
          {lead.city}
        </p>
      )}

      {/* Contact */}
      <div className="flex items-center gap-2 mb-3 text-[11px]">
        {lead.email && (
          <span className="text-gray-400 truncate max-w-[120px]" title={lead.email}>
            {lead.email}
          </span>
        )}
        {lead.phone && !lead.email && (
          <span className="text-gray-400">{lead.phone}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Stage CTA */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStageMenu(!showStageMenu);
            }}
            disabled={isUpdating}
            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${STAGE_CONFIG[lead.stage].bg} ${STAGE_CONFIG[lead.stage].border} ${STAGE_CONFIG[lead.stage].text} ${STAGE_CONFIG[lead.stage].hoverBg}`}
          >
            {isUpdating ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                Moving...
              </span>
            ) : (
              STAGE_CONFIG[lead.stage].label
            )}
          </button>

          {/* Stage Dropdown */}
          {showStageMenu && !isUpdating && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStageMenu(false);
                }}
              />
              <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                {STAGES.filter(s => s !== lead.stage).map((stage) => (
                  <button
                    key={stage}
                    onClick={(e) => {
                      onStageChange(lead.id, stage, e);
                      setShowStageMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-[11px] transition-colors ${STAGE_CONFIG[stage].text} hover:bg-gray-700/50`}
                  >
                    Move to {STAGE_CONFIG[stage].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tags & Score */}
        <div className="flex items-center gap-2">
          {!lead.hasWebsite && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded">
              No site
            </span>
          )}
          {lead.score !== null && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <ScoreIcon className="w-3 h-3" />
              {lead.score}
            </div>
          )}
        </div>
      </div>

      {/* Reminder indicator */}
      {lead.nextReminder && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <ReminderIndicator remindAt={lead.nextReminder.remindAt} />
        </div>
      )}
    </motion.div>
  );
}

function LeadRow({
  lead,
  index,
  isSelected,
  onSelect,
  onClick,
  onStageChange,
  isUpdating,
}: {
  lead: Lead;
  index: number;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onStageChange: (id: string, stage: string, e?: React.MouseEvent) => void;
  isUpdating: boolean;
}) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const scoreColor =
    lead.lighthouseScore === null
      ? "text-gray-500"
      : lead.lighthouseScore >= 70
        ? "text-emerald-400"
        : lead.lighthouseScore >= 50
          ? "text-amber-400"
          : "text-red-400";

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${isSelected ? "bg-accent/5" : ""}`}
    >
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(lead.id, e as unknown as React.MouseEvent)}
          className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-accent focus:ring-accent/50"
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white hover:text-accent transition-colors">
              {lead.businessName}
            </p>
            {lead.category && <p className="text-[11px] text-gray-500 mt-0.5">{lead.category}</p>}
          </div>
          {lead.nextReminder && (
            <ReminderIndicator remindAt={lead.nextReminder.remindAt} />
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="space-y-0.5">
          {lead.email && (
            <p className="text-[13px] text-blue-400 truncate max-w-[180px]">{lead.email}</p>
          )}
          {lead.phone && <p className="text-[13px] text-gray-400">{lead.phone}</p>}
          {!lead.email && !lead.phone && <p className="text-[13px] text-gray-600">No contact</p>}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <p className="text-[13px] text-gray-400">{lead.city || "Unknown"}</p>
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-[13px] font-medium ${scoreColor}`}>
          {lead.lighthouseScore !== null ? lead.lighthouseScore : "N/A"}
        </span>
      </td>
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        {/* Stage CTA Pills */}
        <div className="relative">
          <div className="flex items-center gap-1">
            {STAGES.map((stage) => (
              <button
                key={stage}
                onClick={(e) => {
                  if (lead.stage !== stage) {
                    onStageChange(lead.id, stage, e);
                  }
                }}
                disabled={isUpdating}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                  lead.stage === stage
                    ? `${STAGE_CONFIG[stage].bg} ${STAGE_CONFIG[stage].border} ${STAGE_CONFIG[stage].text}`
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                }`}
              >
                {isUpdating && lead.stage !== stage ? (
                  <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  STAGE_CONFIG[stage].label
                )}
              </button>
            ))}
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="p-8 text-center border border-gray-800 rounded-lg bg-gray-900">
      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
        <UsersIcon className="w-6 h-6 text-gray-600" />
      </div>
      <p className="text-[13px] text-gray-400 font-medium">{hasFilters ? "No leads match your filters" : "No leads yet"}</p>
      <p className="text-[11px] text-gray-500 mt-1">
        {hasFilters ? "Try adjusting your search criteria" : "Start scraping to discover new leads"}
      </p>
      {!hasFilters && (
        <Link
          href="/dashboard/scrape"
          className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-accent hover:text-[#FF8C40]"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Find leads
        </Link>
      )}
    </div>
  );
}

function ReminderIndicator({ remindAt }: { remindAt: string }) {
  const date = new Date(remindAt);
  const now = new Date();
  const isOverdue = date < now;
  const isToday = date.toDateString() === now.toDateString();

  const formatDate = () => {
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
        isOverdue
          ? "bg-red-500/20 text-red-400"
          : isToday
            ? "bg-amber-500/20 text-amber-400"
            : "bg-gray-700 text-gray-400"
      }`}
      title={`Reminder: ${date.toLocaleString()}`}
    >
      <BellIcon className="w-3 h-3" />
      <span>{formatDate()}</span>
    </div>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function ScoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
