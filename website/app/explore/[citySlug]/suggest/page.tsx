"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

// ---------------------------------------------------------------------------
// Design tokens (hand-drawn brand)
// ---------------------------------------------------------------------------

const COLORS = {
  paperCream: "var(--pm-surface, #FDF6EC)",
  inkBlack: "var(--pm-ink, #2D2926)",
  pencilGray: "var(--pm-muted, #6B6560)",
  pencilLight: "#B8B2AB",
  successGreen: "#5B8C5A",
  errorRed: "#C4453C",
  ruleLineFaint: "rgba(107, 101, 96, 0.12)",
} as const;

// Removed sketchy border-radius in favor of soft rounded corners

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SuggestPage() {
  const params = useParams();
  const citySlug = params.citySlug as string;

  // Form state
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [whyYouLoveIt, setWhyYouLoveIt] = useState("");
  const [suggestedByName, setSuggestedByName] = useState("");
  const [suggestedByEmail, setSuggestedByEmail] = useState("");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(
          `${API_BASE}/categories?limit=100&isGlobal=true`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch {
        // Categories are optional — fail silently
      }
    }
    loadCategories();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        whyYouLoveIt: whyYouLoveIt.trim(),
      };

      if (categorySlug) {
        body.categorySlug = categorySlug;
      }
      if (suggestedByName.trim()) {
        body.suggestedByName = suggestedByName.trim();
      }
      if (suggestedByEmail.trim()) {
        body.suggestedByEmail = suggestedByEmail.trim();
      }

      // Validate lat/lng are numbers
      if (isNaN(body.latitude as number) || isNaN(body.longitude as number)) {
        setErrorMessage("Please enter valid latitude and longitude values.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE}/cities/${citySlug}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg =
          errJson?.error?.message || "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (isSuccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: COLORS.paperCream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            padding: "48px 32px",
            backgroundColor: "#fff",
            border: "1.5px solid rgba(45, 41, 38, 0.15)",
            borderRadius: "12px",
          }}
        >
          {/* Hand-drawn checkmark */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={{ margin: "0 auto 24px" }}
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke={COLORS.successGreen}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />
            <path
              d="M20 33 L28 41 L44 24"
              stroke={COLORS.successGreen}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.successGreen,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            Thank You!
          </h2>

          <p
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 20,
              color: COLORS.pencilGray,
              lineHeight: 1.5,
              marginBottom: 32,
            }}
          >
            Your suggestion will be reviewed by our local curator. We appreciate
            locals like you helping fellow travelers discover the best spots.
          </p>

          <Link
            href={`/explore/${citySlug}`}
            style={{
              display: "inline-block",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.paperCream,
              backgroundColor: COLORS.inkBlack,
              border: "1.5px solid rgba(45, 41, 38, 0.3)",
              borderRadius: "8px",
              padding: "12px 32px",
              textDecoration: "none",
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1.5px solid rgba(45, 41, 38, 0.3)",
    outline: "none",
    fontFamily: "var(--font-kalam), cursive",
    fontSize: 20,
    color: COLORS.inkBlack,
    padding: "8px 0",
    lineHeight: 1.4,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-kalam), cursive",
    fontSize: 16,
    color: COLORS.pencilGray,
    marginBottom: 4,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 28,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.paperCream,
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href={`/explore/${citySlug}`}
          style={{
            display: "inline-block",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 18,
            color: COLORS.pencilGray,
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          &larr; Back to map
        </Link>

        {/* Header */}
        <h1
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.inkBlack,
            marginBottom: 8,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Suggest a Spot
        </h1>
        <p
          style={{
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 22,
            color: COLORS.pencilGray,
            marginBottom: 40,
            lineHeight: 1.3,
          }}
        >
          Know a hidden gem? Tell us about it.
        </p>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#fff",
            border: "1.5px solid rgba(45, 41, 38, 0.15)",
            borderRadius: "12px",
            padding: "36px 32px 40px",
          }}
        >
          {/* Place name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Place name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chamundi Hill Temple"
              style={inputBaseStyle}
            />
          </div>

          {/* Location */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Location *</label>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    ...labelStyle,
                    fontSize: 14,
                    color: COLORS.pencilLight,
                  }}
                >
                  Latitude
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="12.2726"
                  style={inputBaseStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    ...labelStyle,
                    fontSize: 14,
                    color: COLORS.pencilLight,
                  }}
                >
                  Longitude
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="76.6434"
                  style={inputBaseStyle}
                />
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: 14,
                color: COLORS.pencilLight,
                marginTop: 8,
              }}
            >
              Tip: Long-press on Google Maps to copy coordinates
            </p>
          </div>

          {/* Category dropdown */}
          {categories.length > 0 && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Category</label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                style={{
                  ...inputBaseStyle,
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6560' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 4px center",
                  paddingRight: 24,
                }}
              >
                <option value="">Pick a category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.emoji ? `${cat.emoji} ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Why you love it (textarea with ruled lines) */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Why you love it * &mdash; What makes this place special? Share a
              tip!
            </label>
            <div
              style={{
                position: "relative",
                backgroundColor: COLORS.paperCream,
                borderRadius: 4,
                border: `1px solid ${COLORS.pencilLight}`,
                overflow: "hidden",
              }}
            >
              {/* Ruled line background */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 27px,
                    ${COLORS.ruleLineFaint} 27px,
                    ${COLORS.ruleLineFaint} 28px
                  )`,
                  backgroundPosition: "0 8px",
                  pointerEvents: "none",
                }}
              />
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={whyYouLoveIt}
                onChange={(e) => setWhyYouLoveIt(e.target.value)}
                placeholder="The sunrise view from the hilltop is magical. Go early to beat the crowds..."
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: 20,
                  color: COLORS.inkBlack,
                  padding: "10px 12px",
                  lineHeight: "28px",
                  resize: "vertical",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </div>
          </div>

          {/* Optional: Your name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Your name &mdash; Want credit? Leave your name
            </label>
            <input
              type="text"
              value={suggestedByName}
              onChange={(e) => setSuggestedByName(e.target.value)}
              placeholder="(optional)"
              style={inputBaseStyle}
            />
          </div>

          {/* Optional: Email */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Email &mdash; We&apos;ll let you know when it&apos;s approved
            </label>
            <input
              type="email"
              value={suggestedByEmail}
              onChange={(e) => setSuggestedByEmail(e.target.value)}
              placeholder="(optional)"
              style={inputBaseStyle}
            />
          </div>

          {/* Error message */}
          {errorMessage && (
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: 18,
                color: COLORS.errorRed,
                marginBottom: 20,
                lineHeight: 1.4,
              }}
            >
              {errorMessage}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.paperCream,
              backgroundColor: isSubmitting
                ? COLORS.pencilGray
                : COLORS.inkBlack,
              border: "1.5px solid rgba(45, 41, 38, 0.3)",
              borderRadius: "8px",
              padding: "14px 32px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "opacity 0.15s ease",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Sending..." : "Send Your Suggestion"}
          </button>
        </form>
      </div>
    </div>
  );
}
