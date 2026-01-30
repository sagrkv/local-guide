"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

// ============================================================================
// Types
// ============================================================================

export type ActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "TASK";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  outcome: string | null;
  createdAt: string;
  completedAt: string | null;
  scheduledAt?: string | null;
  user: { id: string; name: string };
}

interface ActivityTimelineProps {
  leadId: string;
  activities: Activity[];
  onActivityCreated?: () => void;
  onActivityCompleted?: () => void;
}

interface ActivityFormData {
  type: ActivityType;
  title: string;
  description: string;
  scheduledAt?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACTIVITY_TYPES: { type: ActivityType; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { type: "NOTE", label: "Note", color: "text-gray-400", bgColor: "bg-gray-600/30", borderColor: "border-gray-600/50" },
  { type: "CALL", label: "Call", color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500/30" },
  { type: "EMAIL", label: "Email", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/30" },
  { type: "MEETING", label: "Meeting", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/30" },
  { type: "TASK", label: "Task", color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/30" },
];

const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { color: string; bgColor: string; borderColor: string; label: string }> = {
  NOTE: { color: "text-gray-400", bgColor: "bg-gray-600/30", borderColor: "border-gray-600/50", label: "Note" },
  CALL: { color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500/30", label: "Call" },
  EMAIL: { color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/30", label: "Email" },
  MEETING: { color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/30", label: "Meeting" },
  TASK: { color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/30", label: "Task" },
};

// ============================================================================
// Main Component
// ============================================================================

export function ActivityTimeline({ leadId, activities, onActivityCreated, onActivityCompleted }: ActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>("NOTE");
  const [formData, setFormData] = useState<ActivityFormData>({
    type: "NOTE",
    title: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleQuickAction = (type: ActivityType) => {
    setSelectedType(type);
    setFormData({ ...formData, type, title: "", description: "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      await apiClient.createActivity({
        leadId,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        scheduledAt: formData.scheduledAt || undefined,
      });

      toast.success(`${ACTIVITY_TYPE_CONFIG[formData.type].label} added`);
      setShowForm(false);
      setFormData({ type: "NOTE", title: "", description: "" });
      onActivityCreated?.();
    } catch {
      toast.error("Failed to create activity");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (activityId: string) => {
    setCompletingId(activityId);
    try {
      await apiClient.completeActivity(activityId);
      toast.success("Activity marked as complete");
      onActivityCompleted?.();
    } catch {
      toast.error("Failed to complete activity");
    } finally {
      setCompletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map(({ type, label, bgColor, borderColor, color }) => (
          <button
            key={type}
            onClick={() => handleQuickAction(type)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
              ${bgColor} ${borderColor} ${color}
              hover:opacity-80 active:scale-95
              flex items-center gap-1.5
            `}
          >
            <ActivityTypeIcon type={type} size="sm" />
            Add {label}
          </button>
        ))}
      </div>

      {/* Activity Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${ACTIVITY_TYPE_CONFIG[selectedType].bgColor}`}>
                    <ActivityTypeIcon type={selectedType} size="sm" />
                  </div>
                  <span className={`text-sm font-medium ${ACTIVITY_TYPE_CONFIG[selectedType].color}`}>
                    New {ACTIVITY_TYPE_CONFIG[selectedType].label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Type Selector */}
              <div className="flex gap-1.5">
                {ACTIVITY_TYPES.map(({ type, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type);
                      setFormData({ ...formData, type });
                    }}
                    className={`
                      px-2.5 py-1 text-xs font-medium rounded-md transition-all
                      ${
                        selectedType === type
                          ? `${ACTIVITY_TYPE_CONFIG[type].bgColor} ${ACTIVITY_TYPE_CONFIG[type].color} ${ACTIVITY_TYPE_CONFIG[type].borderColor} border`
                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={getPlaceholder(selectedType)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm"
                  autoFocus
                />
              </div>

              {/* Description Textarea */}
              <div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details... (optional)"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm resize-none"
                />
              </div>

              {/* Scheduled Date (for Tasks/Meetings) */}
              {(selectedType === "TASK" || selectedType === "MEETING") && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    {selectedType === "MEETING" ? "Meeting Date/Time" : "Due Date"}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt || ""}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent/50 text-sm"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim()}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-light text-background text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      {sortedActivities.length === 0 ? (
        <EmptyState onAddNote={() => handleQuickAction("NOTE")} />
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-700/50" />

          {/* Activities */}
          <div className="space-y-4">
            {sortedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={index}
                formatDate={formatDate}
                formatFullDate={formatFullDate}
                onComplete={handleComplete}
                isCompleting={completingId === activity.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function ActivityItem({
  activity,
  index,
  formatDate,
  formatFullDate,
  onComplete,
  isCompleting,
}: {
  activity: Activity;
  index: number;
  formatDate: (date: string) => string;
  formatFullDate: (date: string) => string;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const isTask = activity.type === "TASK";
  const isCompleted = !!activity.completedAt;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-4 group"
    >
      {/* Icon Container */}
      <div
        className={`
          relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${config.bgColor} border ${config.borderColor}
          ${isCompleted ? "opacity-60" : ""}
        `}
      >
        <ActivityTypeIcon type={activity.type} />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 pb-4 ${isCompleted ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-white ${isCompleted ? "line-through" : ""}`}>
                {activity.title}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                {config.label}
              </span>
              {isCompleted && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  Completed
                </span>
              )}
            </div>
            {activity.description && (
              <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{activity.description}</p>
            )}
            {activity.outcome && (
              <div className="mt-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-500 mb-1">Outcome</p>
                <p className="text-sm text-gray-300">{activity.outcome}</p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span title={formatFullDate(activity.createdAt)}>{formatDate(activity.createdAt)}</span>
              <span>by {activity.user.name}</span>
              {activity.scheduledAt && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  Scheduled: {formatFullDate(activity.scheduledAt)}
                </span>
              )}
            </div>
          </div>

          {/* Complete Button (for tasks) */}
          {isTask && !isCompleted && (
            <button
              onClick={() => onComplete(activity.id)}
              disabled={isCompleting}
              className="p-1.5 text-gray-500 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Mark as complete"
            >
              {isCompleting ? (
                <span className="animate-spin rounded-full h-4 w-4 border border-green-400 border-t-transparent inline-block" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onAddNote }: { onAddNote: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <TimelineIcon className="w-8 h-8 text-gray-600" />
      </div>
      <p className="text-gray-400 font-medium">No activities yet</p>
      <p className="text-sm text-gray-500 mt-1">Start tracking your interactions with this lead</p>
      <button
        onClick={onAddNote}
        className="inline-flex items-center gap-2 mt-4 text-sm text-accent hover:text-accent-light transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add your first note
      </button>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPlaceholder(type: ActivityType): string {
  switch (type) {
    case "NOTE":
      return "Add a note about this lead...";
    case "CALL":
      return "Log a call (e.g., Discussed pricing options)";
    case "EMAIL":
      return "Log an email (e.g., Sent introduction email)";
    case "MEETING":
      return "Log a meeting (e.g., Initial discovery call)";
    case "TASK":
      return "Add a task (e.g., Send follow-up proposal)";
  }
}

// ============================================================================
// Icons
// ============================================================================

function ActivityTypeIcon({ type, size = "md" }: { type: ActivityType; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const config = ACTIVITY_TYPE_CONFIG[type];

  switch (type) {
    case "CALL":
      return (
        <svg className={`${sizeClass} ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    case "EMAIL":
      return (
        <svg className={`${sizeClass} ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case "MEETING":
      return (
        <svg className={`${sizeClass} ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "TASK":
      return (
        <svg className={`${sizeClass} ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      );
    default:
      return (
        <svg className={`${sizeClass} ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
  }
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

function TimelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default ActivityTimeline;
