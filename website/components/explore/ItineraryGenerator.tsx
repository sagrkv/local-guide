"use client";

import React, { useState, useCallback } from "react";
import { Clock, Footprints, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Brand tokens — matching existing Paper Maps hand-drawn system
// ---------------------------------------------------------------------------

const COLORS = {
  inkBlack: "var(--pm-ink, #2D2926)",
  paperCream: "var(--pm-paper, #FDF6EC)",
  brightPaper: "var(--pm-surface, #FFF9F0)",
  terraCotta: "var(--pm-accent, #C4663A)",
  oceanBlue: "#4A7FB5",
  mutedText: "var(--pm-muted, #8B7D6B)",
  white: "#FFFFFF",
  lightBorder: "rgba(45, 41, 38, 0.12)",
  faintBg: "rgba(45, 41, 38, 0.04)",
};

// Removed sketchy border-radius in favor of soft rounded corners

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratedStop {
  poiId: string;
  poiName: string;
  poiSlug: string;
  order: number;
  arrivalTime: string;
  duration: string;
  note: string;
  transportToNext?: string;
}

interface GeneratedItinerary {
  title: string;
  description: string;
  totalDuration: string;
  stops: GeneratedStop[];
}

interface ItineraryGeneratorProps {
  citySlug: string;
  cityName: string;
  onPOISelect?: (poiSlug: string) => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const DURATION_OPTIONS = [
  { value: "2-hours", label: "2 hours" },
  { value: "half-day", label: "Half day" },
  { value: "full-day", label: "Full day" },
  { value: "2-days", label: "2 days" },
] as const;

const INTEREST_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "history", label: "History" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "architecture", label: "Architecture" },
  { value: "art", label: "Art" },
] as const;

const PACE_OPTIONS = [
  { value: "relaxed", label: "Relaxed" },
  { value: "moderate", label: "Moderate" },
  { value: "packed", label: "Packed" },
] as const;

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ItineraryAPIResponse {
  data: GeneratedItinerary;
}

async function generateItineraryAPI(
  citySlug: string,
  body: {
    duration: string;
    interests: string[];
    startTime?: string;
    pace?: string;
  },
): Promise<GeneratedItinerary> {
  const res = await fetch(
    `${API_BASE}/v1/cities/${citySlug}/generate-itinerary`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      body?.error?.message || "Could not generate itinerary. Try again.";
    throw new Error(msg);
  }

  const json: ItineraryAPIResponse = await res.json();
  return json.data;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PillButton({
  label,
  isSelected,
  onClick,
  accentColor,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: string;
}) {
  const accent = accentColor || COLORS.terraCotta;

  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: "20px",
        border: `1.5px solid ${isSelected ? accent : COLORS.lightBorder}`,
        backgroundColor: isSelected ? accent : COLORS.white,
        color: isSelected ? COLORS.white : COLORS.inkBlack,
        cursor: "pointer",
        fontSize: "13px",
        fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
        fontWeight: isSelected ? 700 : 400,
        transition:
          "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ToggleChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "16px",
        border: `1.5px solid ${isSelected ? COLORS.terraCotta : COLORS.lightBorder}`,
        backgroundColor: isSelected ? "rgba(196, 102, 58, 0.1)" : COLORS.white,
        color: isSelected ? COLORS.terraCotta : COLORS.inkBlack,
        cursor: "pointer",
        fontSize: "13px",
        fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
        fontWeight: isSelected ? 700 : 400,
        transition:
          "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Loading animation — pencil drawing on paper
// ---------------------------------------------------------------------------

function LoadingAnimation() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: "16px",
      }}
    >
      {/* Animated pencil path SVG */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        style={{ overflow: "visible" }}
      >
        {/* Paper background */}
        <rect
          x="10"
          y="10"
          width="60"
          height="60"
          rx="4"
          fill={COLORS.brightPaper}
          stroke={COLORS.inkBlack}
          strokeWidth="1.5"
        />
        {/* Animated dashed route path */}
        <path
          d="M25 25 L35 35 L50 30 L55 50 L40 55"
          stroke={COLORS.terraCotta}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          fill="none"
          style={{
            animation: "itinDrawPath 2s ease-in-out infinite",
          }}
        />
        {/* Stop dots */}
        {[
          [25, 25],
          [35, 35],
          [50, 30],
          [55, 50],
          [40, 55],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="3"
            fill={COLORS.terraCotta}
            style={{
              animation: `itinDotPulse 2s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </svg>
      <p
        style={{
          fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
          fontSize: "20px",
          color: COLORS.terraCotta,
          margin: 0,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        Drawing your route...
      </p>
      <p
        style={{
          fontFamily: "inherit",
          fontSize: "13px",
          color: COLORS.mutedText,
          margin: 0,
          textAlign: "center",
        }}
      >
        Paper Maps is crafting the perfect itinerary
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline stop component
// ---------------------------------------------------------------------------

function TimelineStop({
  stop,
  isLast,
  onPOISelect,
}: {
  stop: GeneratedStop;
  isLast: boolean;
  onPOISelect?: (poiSlug: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "16px", position: "relative" }}>
      {/* Left column: circle + connector line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: "32px",
        }}
      >
        {/* Stop number circle */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "12px",
            backgroundColor: COLORS.terraCotta,
            color: COLORS.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
            fontSize: "16px",
            fontWeight: 700,
            flexShrink: 0,
            border: "1.5px solid rgba(45, 41, 38, 0.15)",
          }}
        >
          {stop.order}
        </div>

        {/* Dashed connector line */}
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: "2px",
              minHeight: "24px",
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                ${COLORS.inkBlack} 0px,
                ${COLORS.inkBlack} 4px,
                transparent 4px,
                transparent 8px
              )`,
              margin: "4px 0",
            }}
          />
        )}
      </div>

      {/* Right column: stop details */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "20px" }}>
        {/* Time + Duration row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: COLORS.mutedText,
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            {stop.arrivalTime}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: COLORS.mutedText,
              fontFamily: "inherit",
            }}
          >
            &middot;
          </span>
          <span
            style={{
              fontSize: "12px",
              color: COLORS.mutedText,
              fontFamily: "inherit",
            }}
          >
            {stop.duration}
          </span>
        </div>

        {/* POI name (clickable) */}
        <button
          onClick={() => onPOISelect?.(stop.poiSlug)}
          style={{
            background: "none",
            border: "none",
            cursor: onPOISelect ? "pointer" : "default",
            padding: 0,
            margin: "0 0 6px",
            fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
            fontSize: "17px",
            fontWeight: 600,
            color: COLORS.inkBlack,
            textAlign: "left",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            textDecoration: "none",
            borderBottom: onPOISelect
              ? `1.5px solid ${COLORS.lightBorder}`
              : "none",
            transition: "border-color 0.15s ease",
            display: "inline-block",
          }}
          onMouseEnter={(e) => {
            if (onPOISelect) {
              (e.currentTarget as HTMLButtonElement).style.borderBottomColor =
                COLORS.terraCotta;
            }
          }}
          onMouseLeave={(e) => {
            if (onPOISelect) {
              (e.currentTarget as HTMLButtonElement).style.borderBottomColor =
                COLORS.lightBorder;
            }
          }}
        >
          {stop.poiName}
        </button>

        {/* Personal tip */}
        <p
          style={{
            margin: "0 0 4px",
            fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
            fontSize: "15px",
            color: COLORS.terraCotta,
            lineHeight: 1.4,
            fontStyle: "italic",
          }}
        >
          &ldquo;{stop.note}&rdquo;
        </p>

        {/* Transport to next */}
        {!isLast && stop.transportToNext && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              padding: "4px 0",
            }}
          >
            <Footprints size={14} strokeWidth={1.8} color={COLORS.mutedText} />
            <span
              style={{
                fontSize: "12px",
                color: COLORS.mutedText,
                fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
              }}
            >
              {stop.transportToNext}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ItineraryGenerator({
  citySlug,
  cityName,
  onPOISelect,
  onClose,
}: ItineraryGeneratorProps) {
  // Form state
  const [duration, setDuration] = useState<string>("half-day");
  const [interests, setInterests] = useState<string[]>(["food", "culture"]);
  const [startTime, setStartTime] = useState<string>("");
  const [pace, setPace] = useState<string>("moderate");

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (interests.length === 0) {
      setErrorMsg("Pick at least one interest!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setItinerary(null);

    try {
      const result = await generateItineraryAPI(citySlug, {
        duration,
        interests,
        startTime: startTime || undefined,
        pace,
      });
      setItinerary(result);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [citySlug, duration, interests, startTime, pace]);

  const handleReset = useCallback(() => {
    setItinerary(null);
    setErrorMsg(null);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <div
        style={{
          backgroundColor: COLORS.paperCream,
          border: "1.5px solid rgba(45, 41, 38, 0.15)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: `1px solid ${COLORS.lightBorder}`,
            backgroundColor: COLORS.paperCream,
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
                fontSize: "20px",
                fontWeight: 700,
                color: COLORS.inkBlack,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Plan My Route
            </h2>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "13px",
                fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                color: COLORS.terraCotta,
              }}
            >
              AI-crafted itinerary for {cityName}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: COLORS.inkBlack,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Scrollable content area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px 20px",
          }}
        >
          {/* ---------- Form (shown when no itinerary) ---------- */}
          {!itinerary && !isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Duration */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: COLORS.inkBlack,
                    marginBottom: "8px",
                  }}
                >
                  How long do you have?
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <PillButton
                      key={opt.value}
                      label={opt.label}
                      isSelected={duration === opt.value}
                      onClick={() => setDuration(opt.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: COLORS.inkBlack,
                    marginBottom: "8px",
                  }}
                >
                  What are you into?
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {INTEREST_OPTIONS.map((opt) => (
                    <ToggleChip
                      key={opt.value}
                      label={opt.label}
                      isSelected={interests.includes(opt.value)}
                      onClick={() => toggleInterest(opt.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Start time */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: COLORS.inkBlack,
                    marginBottom: "8px",
                  }}
                >
                  Start time{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: COLORS.mutedText,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="e.g., 9am"
                  style={{
                    width: "120px",
                    padding: "8px 12px",
                    border: "none",
                    borderBottom: `2px solid ${COLORS.lightBorder}`,
                    backgroundColor: "transparent",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "15px",
                    color: COLORS.inkBlack,
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = COLORS.terraCotta;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = COLORS.lightBorder;
                  }}
                />
              </div>

              {/* Pace */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: COLORS.inkBlack,
                    marginBottom: "8px",
                  }}
                >
                  Your pace
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {PACE_OPTIONS.map((opt) => (
                    <PillButton
                      key={opt.value}
                      label={opt.label}
                      isSelected={pace === opt.value}
                      onClick={() => setPace(opt.value)}
                      accentColor={COLORS.oceanBlue}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "var(--pm-surface, #FFF0EE)",
                    border: "1px solid rgba(196, 102, 58, 0.2)",
                    fontSize: "13px",
                    color: COLORS.terraCotta,
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={interests.length === 0}
                style={{
                  padding: "14px 24px",
                  borderRadius: "12px",
                  backgroundColor:
                    interests.length === 0
                      ? "rgba(45, 41, 38, 0.15)"
                      : COLORS.inkBlack,
                  color: COLORS.paperCream,
                  border: `1.5px solid ${interests.length === 0 ? "rgba(45, 41, 38, 0.15)" : "rgba(45, 41, 38, 0.3)"}`,
                  cursor: interests.length === 0 ? "default" : "pointer",
                  fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (interests.length > 0) {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)";
                }}
              >
                Generate My Itinerary
              </button>
            </div>
          )}

          {/* ---------- Loading state ---------- */}
          {isLoading && <LoadingAnimation />}

          {/* ---------- Generated itinerary ---------- */}
          {itinerary && !isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title + description */}
              <div>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: COLORS.inkBlack,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {itinerary.title}
                </h3>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    color: COLORS.mutedText,
                    lineHeight: 1.5,
                  }}
                >
                  {itinerary.description}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    backgroundColor: COLORS.faintBg,
                    marginTop: "4px",
                  }}
                >
                  <Clock size={14} strokeWidth={1.8} color={COLORS.mutedText} />
                  <span
                    style={{
                      fontSize: "12px",
                      color: COLORS.mutedText,
                      fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                      fontWeight: 700,
                    }}
                  >
                    {itinerary.totalDuration}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  backgroundColor: COLORS.lightBorder,
                }}
              />

              {/* Timeline */}
              <div>
                {itinerary.stops.map((stop, idx) => (
                  <TimelineStop
                    key={stop.poiId + idx}
                    stop={stop}
                    isLast={idx === itinerary.stops.length - 1}
                    onPOISelect={onPOISelect}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  paddingTop: "8px",
                }}
              >
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "transparent",
                    color: COLORS.inkBlack,
                    border: "1.5px solid rgba(45, 41, 38, 0.3)",
                    cursor: "pointer",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "15px",
                    fontWeight: 700,
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      COLORS.faintBg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  Start Over
                </button>
                <button
                  onClick={handleGenerate}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: COLORS.inkBlack,
                    color: COLORS.paperCream,
                    border: "1.5px solid rgba(45, 41, 38, 0.3)",
                    cursor: "pointer",
                    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
                    fontSize: "15px",
                    fontWeight: 700,
                    transition: "transform 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "scale(1)";
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes itinDrawPath {
          0% {
            stroke-dashoffset: 40;
            opacity: 0.3;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -40;
            opacity: 0.3;
          }
        }

        @keyframes itinDotPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
