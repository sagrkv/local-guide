"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { PreviewBanner } from "./PreviewBanner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewGateProps {
  cityId: string;
  citySlug: string;
  cityStatus: string;
  adminPrefix: string;
  children: ReactNode;
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
 * PreviewGate wraps explore pages for DRAFT cities.
 *
 * - PUBLISHED / ARCHIVED cities render children immediately.
 * - DRAFT cities are hidden by default (404-style screen).
 * - DRAFT cities with ?preview=true show content only after verifying
 *   the visitor has an admin token in localStorage.
 */
export function PreviewGate({
  cityId,
  citySlug,
  cityStatus,
  adminPrefix,
  children,
}: PreviewGateProps) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const isDraft = cityStatus === "DRAFT";

  const [authState, setAuthState] = useState<
    "loading" | "authorized" | "unauthorized"
  >(isDraft && isPreview ? "loading" : isDraft ? "unauthorized" : "authorized");

  useEffect(() => {
    // Only need to check auth for draft cities in preview mode
    if (!isDraft || !isPreview) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("lg_token")
        : null;

    if (!token) {
      setAuthState("unauthorized");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setAuthState("unauthorized");
          return;
        }
        const json = await res.json();
        const user = json.data || json.user || json;
        if (!cancelled) {
          setAuthState(user.role === "ADMIN" ? "authorized" : "unauthorized");
        }
      } catch {
        if (!cancelled) setAuthState("unauthorized");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [isDraft, isPreview]);

  // Loading state while verifying admin access for draft preview
  if (authState === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Verifying access...
      </div>
    );
  }

  // Unauthorized — show a generic 404 to prevent enumeration
  if (authState === "unauthorized") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          gap: "8px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1f2937",
            margin: 0,
          }}
        >
          City Not Found
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: 0,
          }}
        >
          The city you are looking for does not exist or is not available.
        </p>
      </div>
    );
  }

  // Authorized — render content (with preview banner for draft cities)
  return (
    <>
      {isDraft && isPreview && (
        <PreviewBanner
          citySlug={citySlug}
          adminPrefix={adminPrefix}
          cityId={cityId}
        />
      )}
      {children}
    </>
  );
}

export default PreviewGate;
