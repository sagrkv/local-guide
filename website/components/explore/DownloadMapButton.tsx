"use client";

import React, { useState, useEffect } from "react";
import { Download, Check, RefreshCw, X } from "lucide-react";
import { useOfflineMap } from "@/hooks/useOfflineMap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DownloadMapButtonProps {
  citySlug: string;
  cityName: string;
}

// ---------------------------------------------------------------------------
// Hand-drawn brand constants
// ---------------------------------------------------------------------------

const COLORS = {
  ink: "var(--pm-ink, #2D2926)",
  paper: "var(--pm-paper, #FDF6EC)",
  terraCotta: "var(--pm-accent, #C4663A)",
  terraCottaLight: "#D4835E",
  forestGreen: "#5B8C5A",
  forestGreenLight: "#6FA06E",
  warmGray: "var(--pm-muted, #8B7355)",
  border: "var(--pm-muted, #E8D5B7)",
  borderLight: "#F0E6D4",
};

const FONT = {
  decorative: "var(--pm-font-display, 'Kalam', cursive)",
  body: "var(--pm-font-body, 'DM Sans', sans-serif)",
};

// Removed sketchy border-radius in favor of soft rounded corners

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// SVG icon components replaced with Lucide imports above

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const baseButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: "8px",
  backgroundColor: COLORS.paper,
  cursor: "pointer",
  fontFamily: FONT.decorative,
  fontSize: "15px",
  fontWeight: 700,
  color: COLORS.ink,
  transition: "border-color 0.2s ease, background-color 0.2s ease",
  outline: "none",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const progressBarContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 14px",
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: "8px",
  backgroundColor: COLORS.paper,
  fontFamily: FONT.decorative,
  fontSize: "14px",
  color: COLORS.ink,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const progressTrackStyle: React.CSSProperties = {
  width: "80px",
  height: "8px",
  borderRadius: "8px",
  backgroundColor: COLORS.borderLight,
  overflow: "hidden",
  border: `1px solid ${COLORS.border}`,
  position: "relative",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  border: `1.5px solid ${COLORS.forestGreen}40`,
  borderRadius: "8px",
  backgroundColor: `${COLORS.forestGreen}0D`,
  fontFamily: FONT.decorative,
  fontSize: "14px",
  fontWeight: 700,
  color: COLORS.forestGreen,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
};

const smallActionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "3px 8px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "8px",
  backgroundColor: "transparent",
  cursor: "pointer",
  fontFamily: FONT.body,
  fontSize: "11px",
  fontWeight: 500,
  color: COLORS.warmGray,
  transition: "border-color 0.2s ease, color 0.2s ease",
  outline: "none",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DownloadMapButton({ citySlug, cityName }: DownloadMapButtonProps) {
  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    downloadCity,
    removeCity,
    lastSynced,
    updateAvailable,
  } = useOfflineMap(citySlug);

  const [mounted, setMounted] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [updateHovered, setUpdateHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) {
    return null;
  }

  // Check service worker support
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  // ----- Downloading state: progress bar -----
  if (isDownloading) {
    return (
      <div style={progressBarContainerStyle}>
        <div style={progressTrackStyle}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${downloadProgress}%`,
              backgroundColor: COLORS.terraCotta,
              borderRadius: "inherit",
              transition: "width 0.3s ease-out",
            }}
          />
        </div>
        <span style={{ fontWeight: 700 }}>{downloadProgress}%</span>
      </div>
    );
  }

  // ----- Downloaded state: badge + actions -----
  if (isDownloaded) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={badgeStyle}>
          <Check size={14} strokeWidth={1.8} />
          <span>Available offline</span>
        </div>
        <div style={metaRowStyle}>
          {lastSynced && (
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: "11px",
                color: COLORS.warmGray,
              }}
            >
              {formatRelativeTime(lastSynced)}
            </span>
          )}
          {updateAvailable && (
            <button
              type="button"
              onClick={downloadCity}
              onMouseEnter={() => setUpdateHovered(true)}
              onMouseLeave={() => setUpdateHovered(false)}
              style={{
                ...smallActionStyle,
                ...(updateHovered
                  ? {
                      borderColor: COLORS.terraCotta,
                      color: COLORS.terraCotta,
                    }
                  : {}),
              }}
              aria-label={`Update ${cityName} map data`}
            >
              <RefreshCw size={12} strokeWidth={1.8} />
              Update
            </button>
          )}
          <button
            type="button"
            onClick={removeCity}
            onMouseEnter={() => setRemoveHovered(true)}
            onMouseLeave={() => setRemoveHovered(false)}
            style={{
              ...smallActionStyle,
              ...(removeHovered
                ? {
                    borderColor: "#c0392b",
                    color: "#c0392b",
                  }
                : {}),
            }}
            aria-label={`Remove ${cityName} offline data`}
          >
            <X size={12} strokeWidth={1.8} />
            Remove
          </button>
        </div>
      </div>
    );
  }

  // ----- Default state: download button -----
  return (
    <button
      type="button"
      onClick={downloadCity}
      onMouseEnter={() => setButtonHovered(true)}
      onMouseLeave={() => setButtonHovered(false)}
      style={{
        ...baseButtonStyle,
        ...(buttonHovered
          ? {
              borderColor: COLORS.terraCotta,
              backgroundColor: `${COLORS.terraCotta}0D`,
            }
          : {}),
      }}
      aria-label={`Download ${cityName} map for offline use`}
    >
      <Download size={16} strokeWidth={1.8} />
      <span>Download for offline</span>
    </button>
  );
}

export default DownloadMapButton;
