"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface ReviewPOI {
  id: string;
  name: string;
  shortDescription?: string;
  status: string;
  qualityScore?: number;
  category?: { name: string; emoji?: string; color?: string };
}

export default function ReviewQueuePage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [queue, setQueue] = useState<ReviewPOI[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.getReviewQueue(cityId, { limit: 50 });
      setQueue(res.data ?? []);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (actionLoading) return;

      switch (e.key.toLowerCase()) {
        case "a":
          handleApprove();
          break;
        case "r":
          handleReject();
          break;
        case "s":
          handleSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const currentPOI = queue[currentIndex];

  const moveNext = () => {
    setReviewedCount((prev) => prev + 1);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Remove processed items and reset
      setQueue((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
    }
  };

  const handleApprove = async () => {
    if (!currentPOI || actionLoading) return;
    try {
      setActionLoading(true);
      await apiClient.approvePOI(currentPOI.id);
      moveNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentPOI || actionLoading) return;
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      setActionLoading(true);
      await apiClient.rejectPOI(currentPOI.id, reason);
      moveNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = () => {
    if (!currentPOI) return;
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <span className="text-gray-200">Review Queue</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Review Queue</h1>
        <span className="text-[13px] text-gray-500">
          {reviewedCount} reviewed
          {queue.length > 0 && ` | ${currentIndex + 1} of ${queue.length} remaining`}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Shortcuts:</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[11px]">A</kbd> Approve</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[11px]">R</kbd> Reject</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[11px]">S</kbd> Skip</span>
      </div>

      {/* Empty state */}
      {queue.length === 0 && (
        <div className="border border-gray-800 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">&#10003;</div>
          <h2 className="text-lg font-medium text-gray-200 mb-1">All caught up!</h2>
          <p className="text-[13px] text-gray-500">No POIs waiting for review.</p>
        </div>
      )}

      {/* Review Card */}
      {currentPOI && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3 max-w-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-100">{currentPOI.name}</h2>
              {currentPOI.category && (
                <span className="inline-flex items-center gap-1 mt-1">
                  {currentPOI.category.emoji && <span>{currentPOI.category.emoji}</span>}
                  <span
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: currentPOI.category.color ? `${currentPOI.category.color}20` : undefined,
                      color: currentPOI.category.color ?? "#9ca3af",
                    }}
                  >
                    {currentPOI.category.name}
                  </span>
                </span>
              )}
            </div>
            {currentPOI.qualityScore != null && (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                Quality: {currentPOI.qualityScore}%
              </span>
            )}
          </div>

          {currentPOI.shortDescription && (
            <p className="text-[13px] text-gray-400">{currentPOI.shortDescription}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-800/50">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="h-8 px-4 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="h-8 px-4 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleSkip}
              disabled={actionLoading || currentIndex >= queue.length - 1}
              className="h-8 px-4 rounded-md border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 text-[13px] transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <Link
              href={`/${adminPrefix}/pois/${currentPOI.id}`}
              className="h-8 px-4 inline-flex items-center rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 text-[13px] transition-colors ml-auto"
            >
              Edit
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
