"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrintMapButtonProps {
  citySlug: string;
  cityName: string;
}

// ---------------------------------------------------------------------------
// Brand constants (matching DownloadMapButton)
// ---------------------------------------------------------------------------

const COLORS = {
  ink: "var(--pm-ink, #2D2926)",
  paper: "var(--pm-paper, #FDF6EC)",
  terraCotta: "var(--pm-accent, #C4663A)",
  border: "var(--pm-muted, #E8D5B7)",
};

const FONT = {
  decorative: "var(--pm-font-display, 'Kalam', cursive)",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrintMapButton({ citySlug, cityName }: PrintMapButtonProps) {
  const [hovered, setHovered] = useState(false);

  const handlePrint = () => {
    window.open(`/explore/${citySlug}/print`, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
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
        ...(hovered
          ? {
              borderColor: COLORS.terraCotta,
              backgroundColor: `${COLORS.terraCotta}0D`,
            }
          : {}),
      }}
      aria-label={`Print ${cityName} map`}
    >
      <Printer size={16} strokeWidth={1.8} />
      <span>Print map</span>
    </button>
  );
}

export default PrintMapButton;
