"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

interface DueReminder {
  id: string;
  leadId: string;
  remindAt: string;
  note: string | null;
  status: "PENDING" | "COMPLETED" | "DISMISSED";
  createdAt: string;
  lead: {
    id: string;
    businessName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    stage: string;
  };
}

interface DueRemindersWidgetProps {
  className?: string;
}

export function DueRemindersWidget({ className = "" }: DueRemindersWidgetProps) {
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDueReminders = async () => {
    try {
      const data = await apiClient.getDueReminders();
      setReminders(data.data);
    } catch (error) {
      // Silently fail - widget is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueReminders();
  }, []);

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.completeReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reminder completed");
    } catch (error) {
      toast.error("Failed to complete reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.dismissReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reminder dismissed");
    } catch (error) {
      toast.error("Failed to dismiss reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    // Check if it's overdue
    if (date < now) {
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return `${diffDays}d overdue`;
      }
      if (diffHours > 0) {
        return `${diffHours}h overdue`;
      }
      return "overdue";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (dateString: string): boolean => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Due Today</h2>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-700/30 rounded-lg" />
          <div className="h-16 bg-gray-700/30 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Due Today</h2>
            <p className="text-sm text-gray-500">
              {reminders.length === 0
                ? "No reminders due"
                : `${reminders.length} reminder${reminders.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        {reminders.length > 0 && (
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
            {reminders.length}
          </span>
        )}
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-3">
            <CheckCircleIcon className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm">All caught up!</p>
          <p className="text-gray-500 text-xs mt-1">No follow-ups due today</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          <AnimatePresence>
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className={`p-4 rounded-lg border transition-colors ${
                  isOverdue(reminder.remindAt)
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-gray-700/30 border-gray-700/50 hover:border-gray-600/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/leads/${reminder.leadId}`}
                      className="font-medium text-white hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {reminder.lead.businessName}
                    </Link>
                    {reminder.note && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {reminder.note}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`text-xs font-medium ${
                          isOverdue(reminder.remindAt)
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                        {formatTime(reminder.remindAt)}
                      </span>
                      {reminder.lead.city && (
                        <span className="text-xs text-gray-500">
                          {reminder.lead.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleComplete(reminder.id)}
                      disabled={actionLoading === reminder.id}
                      className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Mark as completed"
                    >
                      {actionLoading === reminder.id ? (
                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDismiss(reminder.id)}
                      disabled={actionLoading === reminder.id}
                      className="p-1.5 text-gray-500 hover:text-gray-400 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                      title="Dismiss reminder"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// Compact version for dashboard stat card
export function DueRemindersStatCard() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await apiClient.getDueRemindersCount();
        setCount(data.count);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-8 w-12 bg-gray-700 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Link href="/dashboard/reminders" className="block group">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-amber-500/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <BellIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${count && count > 0 ? "text-amber-400" : "text-white"}`}
            >
              {count}
            </p>
            <p className="text-sm text-gray-400">Due Today</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Icons
function BellIcon({ className }: { className?: string }) {
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
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
