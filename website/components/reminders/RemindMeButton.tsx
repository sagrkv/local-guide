"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface RemindMeButtonProps {
  leadId: string;
  onReminderCreated?: () => void;
}

type QuickOption = {
  label: string;
  days: number;
};

const QUICK_OPTIONS: QuickOption[] = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

export function RemindMeButton({ leadId, onReminderCreated }: RemindMeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleQuickOption = async (days: number) => {
    setLoading(true);
    try {
      const remindAt = new Date();
      remindAt.setDate(remindAt.getDate() + days);
      remindAt.setHours(9, 0, 0, 0); // Default to 9 AM

      await apiClient.createReminder({
        leadId,
        remindAt: remindAt.toISOString(),
      });

      toast.success(`Reminder set for ${formatDate(remindAt)}`);
      setIsOpen(false);
      onReminderCreated?.();
    } catch (error) {
      toast.error("Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = customTime.split(":").map(Number);
      const remindAt = new Date(customDate);
      remindAt.setHours(hours, minutes, 0, 0);

      await apiClient.createReminder({
        leadId,
        remindAt: remindAt.toISOString(),
        note: note || undefined,
      });

      toast.success(`Reminder set for ${formatDate(remindAt)}`);
      setIsOpen(false);
      setShowCustom(false);
      setCustomDate("");
      setNote("");
      onReminderCreated?.();
    } catch (error) {
      toast.error("Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
      >
        <BellIcon className="w-4 h-4" />
        Remind me
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!showCustom ? (
            <>
              {/* Quick Options */}
              <div className="p-2 border-b border-gray-700/50">
                <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quick Options
                </p>
                {QUICK_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    onClick={() => handleQuickOption(option.days)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    {option.label}
                    <span className="ml-auto text-xs text-gray-500">
                      {getDatePreview(option.days)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Option */}
              <div className="p-2">
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  Custom date & time
                  <ChevronRightIcon className="w-4 h-4 ml-auto text-gray-500" />
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                </button>
                <p className="text-sm font-medium text-white">
                  Set Custom Reminder
                </p>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={minDate}
                  required
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
                />
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
                />
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Follow up on proposal"
                  maxLength={200}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !customDate}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting..." : "Set Reminder"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function getDatePreview(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Icons
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
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

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
