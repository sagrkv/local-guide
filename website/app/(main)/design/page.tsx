import LogoExplorations from "@/components/design-system/brand/LogoExplorations";
import ColorSystem from "@/components/design-system/brand/ColorSystem";
import TypeSystem from "@/components/design-system/brand/TypeSystem";
import PatternLibrary from "@/components/design-system/brand/PatternLibrary";
import HandDrawnElements from "@/components/design-system/brand/HandDrawnElements";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Design System — Paper Maps",
  description: "Paper Maps brand identity: hand-drawn logos, colors, typography, patterns, and UI elements.",
};

const sections = [
  { id: "concept", label: "Concept" },
  { id: "logo", label: "Logo" },
  { id: "colors", label: "Colors" },
  { id: "type", label: "Typography" },
  { id: "patterns", label: "Patterns" },
  { id: "elements", label: "Elements" },
];

export default function DesignPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--pm-paper)" }}>
      {/* Hero — Sketchbook cover */}
      <section style={{ paddingTop: 120, paddingBottom: 48, position: "relative" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{
            border: "1.5px solid var(--pm-muted)",
            borderRadius: "16px",
            padding: "48px 40px",
            background: "var(--pm-surface)",
            position: "relative",
          }}>
            <p style={{
              fontFamily: "Kalam, cursive",
              fontSize: 18,
              color: "var(--pm-muted)",
              marginBottom: 8,
              letterSpacing: "0.05em",
            }}>
              ~ brand identity ~
            </p>
            <h1 style={{
              fontFamily: "Fraunces, serif",
              fontSize: "clamp(40px, 7vw, 64px)",
              fontWeight: 700,
              color: "var(--pm-ink)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              Paper Maps
            </h1>
            <p style={{
              fontFamily: "Kalam, cursive",
              fontSize: 24,
              color: "var(--pm-accent)",
              fontWeight: 700,
            }}>
              &quot;Everything is hand-drawn&quot;
            </p>

            {/* Corner brackets */}
            {[
              { top: 8, left: 8, d: "M 2,12 L 2,2 L 12,2" },
              { top: 8, right: 8, d: "M 12,2 L 22,2 L 22,12" },
              { bottom: 8, left: 8, d: "M 2,12 L 2,22 L 12,22" },
              { bottom: 8, right: 8, d: "M 12,22 L 22,22 L 22,12" },
            ].map((pos, i) => (
              <svg
                key={i}
                style={{ position: "absolute", ...pos, width: 24, height: 24 }}
                aria-hidden="true"
              >
                <path d={pos.d} fill="none" stroke="var(--pm-ink)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ))}
          </div>

          <p style={{
            fontFamily: "var(--pm-font-body, DM Sans, sans-serif)",
            fontSize: 16,
            lineHeight: 1.7,
            color: "var(--pm-muted)",
            maxWidth: 520,
            margin: "32px auto 0",
          }}>
            A brand that feels crafted, warm, and personal — like a map
            sketched by a friend who knows every hidden corner of the city.
          </p>
        </div>
      </section>

      {/* Sticky nav */}
      <nav style={{
        position: "sticky",
        top: 72,
        zIndex: 40,
        background: "color-mix(in srgb, var(--pm-paper) 95%, transparent)",
        backdropFilter: "blur(8px)",
        borderTop: "1.5px solid var(--pm-muted)",
        borderBottom: "1.5px solid var(--pm-muted)",
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: 0,
          overflowX: "auto",
        }}>
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: "14px 20px",
                fontFamily: "Kalam, cursive",
                fontSize: 18,
                color: "var(--pm-ink)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                borderRight: i < sections.length - 1 ? "1px solid color-mix(in srgb, var(--pm-ink) 15%, transparent)" : "none",
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content sections */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* 01 — Brand Concept */}
        <section id="concept" style={{ paddingTop: 64 }}>
          <SectionLabel>01 — Brand Concept</SectionLabel>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}>
            {[
              { word: "Artisanal", desc: "Every map feels hand-crafted, not generated" },
              { word: "Warm", desc: "Paper textures, ink strokes, earthy tones" },
              { word: "Exploratory", desc: "Invites wandering, not just navigating" },
              { word: "Personal", desc: "Like borrowing a local friend's notebook" },
              { word: "Tactile", desc: "Digital maps that feel physical" },
              { word: "Opinionated", desc: "Curated picks, not everything-on-the-map" },
            ].map((item) => (
              <div
                key={item.word}
                style={{
                  border: "1.5px solid var(--pm-muted)",
                  borderRadius: "12px",
                  padding: "24px 20px",
                  background: "var(--pm-surface)",
                }}
              >
                <p style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--pm-ink)",
                  marginBottom: 8,
                }}>
                  {item.word}
                </p>
                <p style={{
                  fontFamily: "Kalam, cursive",
                  fontSize: 16,
                  color: "var(--pm-muted)",
                  lineHeight: 1.4,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Not This / But This */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            marginTop: 40,
          }}>
            <div style={{
              padding: 24,
              border: "1.5px dashed #DC2626",
              borderRadius: 8,
              background: "rgba(220, 38, 38, 0.03)",
            }}>
              <p style={{
                fontFamily: "Kalam, cursive",
                fontSize: 20,
                color: "#DC2626",
                marginBottom: 12,
                fontWeight: 700,
              }}>
                Not this
              </p>
              <ul style={listStyle}>
                <li>Generic Google Maps screenshot</li>
                <li>Corporate, sterile, digital-first</li>
                <li>Everything shown, nothing curated</li>
                <li>Perfect geometric shapes</li>
                <li>AI-generated illustrations</li>
              </ul>
            </div>
            <div style={{
              padding: 24,
              border: "1.5px dashed #16A34A",
              borderRadius: 8,
              background: "rgba(22, 163, 74, 0.03)",
            }}>
              <p style={{
                fontFamily: "Kalam, cursive",
                fontSize: 20,
                color: "#16A34A",
                marginBottom: 12,
                fontWeight: 700,
              }}>
                But this
              </p>
              <ul style={listStyle}>
                <li>Hand-sketched map with character</li>
                <li>Warm, inviting, feels like paper</li>
                <li>Curated spots with personal notes</li>
                <li>Imperfect, wobbly, human lines</li>
                <li>Hand-drawn icons and illustrations</li>
              </ul>
            </div>
          </div>
        </section>

        <SketchDivider />

        <section id="logo" style={{ paddingTop: 64 }}>
          <SectionLabel>02 — Logo Explorations</SectionLabel>
          <LogoExplorations />
        </section>

        <SketchDivider />

        <section id="colors" style={{ paddingTop: 64 }}>
          <SectionLabel>03 — Color System</SectionLabel>
          <ColorSystem />
        </section>

        <SketchDivider />

        <section id="type" style={{ paddingTop: 64 }}>
          <SectionLabel>04 — Typography</SectionLabel>
          <TypeSystem />
        </section>

        <SketchDivider />

        <section id="patterns" style={{ paddingTop: 64 }}>
          <SectionLabel>05 — Patterns & Textures</SectionLabel>
          <PatternLibrary />
        </section>

        <SketchDivider />

        <section id="elements" style={{ paddingTop: 64 }}>
          <SectionLabel>06 — UI Elements</SectionLabel>
          <HandDrawnElements />
        </section>
      </div>
    </div>
  );
}

const listStyle: React.CSSProperties = {
  fontFamily: "var(--pm-font-body, DM Sans, sans-serif)",
  fontSize: 14,
  color: "var(--pm-muted)",
  lineHeight: 1.8,
  listStyle: "none",
  padding: 0,
  margin: 0,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "Kalam, cursive",
      fontSize: 20,
      color: "var(--pm-accent)",
      letterSpacing: "0.02em",
      fontWeight: 700,
    }}>
      {children}
    </p>
  );
}

function SketchDivider() {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <svg width="200" height="12" viewBox="0 0 200 12" aria-hidden="true">
        <path
          d="M 5,6 C 30,3 50,9 80,6 C 110,3 130,8 160,5 C 175,4 190,7 195,6"
          fill="none"
          stroke="var(--pm-ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={0.3}
        />
      </svg>
    </div>
  );
}
