"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewBannerProps {
  citySlug: string;
  adminPrefix: string;
  cityId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Amber preview banner shown at the top of the page for DRAFT cities
 * when accessed with ?preview=true by an admin.
 *
 * This component is rendered by PreviewGate only after admin auth has
 * already been verified, so it does not re-check permissions.
 *
 * - Dismissible via the x button
 * - Reappears on page navigation (pathname change)
 * - "Publish City" button calls PATCH to set status=PUBLISHED, then reloads
 */
export function PreviewBanner({
  citySlug,
  adminPrefix,
  cityId,
}: PreviewBannerProps) {
  const pathname = usePathname();

  const [dismissed, setDismissed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Reset dismissed state on navigation
  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  const handlePublish = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("lg_token")
        : null;

    if (!token || publishing) return;

    try {
      setPublishing(true);
      const res = await fetch(`${API_BASE}/cities/${cityId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });

      if (res.ok) {
        setPublished(true);
        // Refresh after a brief pause so the user sees the success state
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch {
      // Silently fail — the user can retry
    } finally {
      setPublishing(false);
    }
  }, [cityId, publishing]);

  if (dismissed) return null;

  const adminCityUrl = `/${adminPrefix}/cities/${cityId}`;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "10px 16px",
        backgroundColor: published ? "#ecfdf5" : "#fffbeb",
        borderBottom: published
          ? "1px solid #a7f3d0"
          : "1px solid #fde68a",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        lineHeight: "1.4",
      }}
    >
      {/* Status text */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: published ? "#065f46" : "#92400e",
          fontWeight: 500,
        }}
      >
        <EyeIcon />
        {published
          ? "City published successfully!"
          : "Preview Mode \u2014 This city is not published yet."}
      </span>

      {/* Action links */}
      {!published && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Link
            href={adminCityUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "32px",
              padding: "0 12px",
              borderRadius: "6px",
              border: "1px solid #d1cdc7",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Back to Admin
          </Link>

          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "32px",
              padding: "0 12px",
              borderRadius: "6px",
              border: "1px solid #059669",
              backgroundColor: "#059669",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: publishing ? "not-allowed" : "pointer",
              opacity: publishing ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {publishing ? "Publishing..." : "Publish City"}
          </button>
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss preview banner"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "transparent",
          color: published ? "#065f46" : "#92400e",
          cursor: "pointer",
          fontSize: "18px",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        &times;
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icon (avoids external dependency)
// ---------------------------------------------------------------------------

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default PreviewBanner;
