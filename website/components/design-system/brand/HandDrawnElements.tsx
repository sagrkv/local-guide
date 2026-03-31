"use client";

const badges = [
  { text: "Must Visit", bg: "#C4663A", color: "#FDF6EC" },
  { text: "Hidden Gem", bg: "#E8B84B", color: "#2D2926" },
  { text: "Free Entry", bg: "#5B8C5A", color: "#FDF6EC" },
  { text: "Food & Drink", bg: "#4A7FB5", color: "#FDF6EC" },
  { text: "Heritage", bg: "#C75B7A", color: "#FDF6EC" },
  { text: "Open Now", bg: "transparent", color: "#5B8C5A", outlined: true },
  { text: "Closed", bg: "transparent", color: "#D64545", outlined: true },
];

const stamps = [
  { line1: "LOCAL", line2: "APPROVED", line3: "\u2605 \u2605 \u2605", color: "#C4663A", rotate: -8 },
  { line1: "HAND", line2: "CURATED", line3: "by locals", color: "#4A7FB5", rotate: 5 },
  { line1: "100%", line2: "FREE", line3: "always", color: "#5B8C5A", rotate: -3 },
];

export default function HandDrawnElements() {
  return (
    <div style={{ marginTop: 24 }}>

      {/* Buttons */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={groupTitle}>Buttons</h3>
        <p style={groupDesc}>Warm buttons that invite interaction</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <button style={{
            ...btnBase,
            background: "#2D2926",
            color: "#FDF6EC",
            border: "1.5px solid #8B7D6B",
            borderRadius: "8px",
          }}>
            Explore Map
          </button>
          <button style={{
            ...btnBase,
            background: "#C4663A",
            color: "#FDF6EC",
            border: "1.5px solid #8B7D6B",
            borderRadius: "8px",
          }}>
            Add to Favorites
          </button>
          <button style={{
            ...btnBase,
            background: "transparent",
            color: "#2D2926",
            border: "1.5px solid #8B7D6B",
            borderRadius: "8px",
          }}>
            View Details
          </button>
          <button style={{
            ...btnBase,
            background: "transparent",
            color: "#4A7FB5",
            border: "1.5px dashed #4A7FB5",
            borderRadius: "8px",
          }}>
            Learn More
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={groupTitle}>Cards</h3>
        <p style={groupDesc}>POI cards, city cards, and content containers</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {/* POI Card */}
          <div style={{
            border: "1.5px solid #8B7D6B",
            borderRadius: "12px",
            background: "#FFF9F0",
            overflow: "hidden",
          }}>
            <div style={{
              height: 140,
              background: "#EDD9C0",
              borderBottom: "1.5px solid #8B7D6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "radial-gradient(circle, rgba(45, 41, 38, 0.06) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}>
              <span style={{ fontFamily: "Kalam, cursive", fontSize: 28, color: "#A39E99" }}>
                photo
              </span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                <div>
                  <p style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#2D2926",
                    marginBottom: 4,
                  }}>
                    Devaraja Market
                  </p>
                  <p style={{ fontFamily: "Kalam, cursive", fontSize: 15, color: "#C4663A" }}>
                    Historic market since 1886
                  </p>
                </div>
                <span style={{
                  fontFamily: "Kalam, cursive",
                  fontSize: 14,
                  color: "#FDF6EC",
                  background: "#5B8C5A",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  Must visit
                </span>
              </div>
              <p style={{
                fontFamily: "var(--m-font-body, DM Sans, sans-serif)",
                fontSize: 14,
                color: "#6B6560",
                lineHeight: 1.6,
                marginTop: 12,
              }}>
                A bustling 130-year-old market where locals buy flowers,
                spices, and fresh produce. Best visited early morning.
              </p>
            </div>
          </div>

          {/* City Card */}
          <div style={{
            border: "1.5px solid #8B7D6B",
            borderRadius: "12px",
            background: "#FFF9F0",
            padding: "28px 24px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: -8,
              right: 20,
              fontFamily: "Kalam, cursive",
              fontSize: 13,
              color: "#FDF6EC",
              background: "#E8B84B",
              padding: "4px 12px",
              borderRadius: "8px",
              border: "1.5px solid #8B7D6B",
            }}>
              12 spots
            </div>
            <p style={{
              fontFamily: "Fraunces, serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#2D2926",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}>
              Mysore
            </p>
            <p style={{ fontFamily: "Kalam, cursive", fontSize: 18, color: "#C4663A", marginBottom: 16 }}>
              City of Palaces
            </p>
            <p style={{
              fontFamily: "var(--m-font-body, DM Sans, sans-serif)",
              fontSize: 14,
              color: "#6B6560",
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              Royal heritage, bustling bazaars, and the best masala
              dosa you&apos;ll ever have.
            </p>
            <button style={{
              ...btnBase,
              background: "#2D2926",
              color: "#FDF6EC",
              border: "1.5px solid #8B7D6B",
              borderRadius: "8px",
              width: "100%",
            }}>
              Open Map &rarr;
            </button>
          </div>

          {/* Annotation Card */}
          <div style={{
            border: "1.5px dashed #A39E99",
            borderRadius: 8,
            background: "#FDF6EC",
            padding: "24px 20px",
            position: "relative",
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 27px,
              rgba(45, 41, 38, 0.05) 27px, rgba(45, 41, 38, 0.05) 28px
            )`,
          }}>
            <div style={{
              width: 4,
              position: "absolute",
              left: 32,
              top: 0,
              bottom: 0,
              borderLeft: "2px solid rgba(196, 102, 58, 0.2)",
            }} />
            <p style={{
              fontFamily: "Kalam, cursive",
              fontSize: 20,
              color: "#2D2926",
              lineHeight: 1.8,
              paddingLeft: 24,
            }}>
              Local tip: Visit the flower market at dawn.
              The colors are incredible and the jasmine
              smell fills the entire street. Grab a filter
              coffee from the stall at the corner.
            </p>
            <p style={{
              fontFamily: "Kalam, cursive",
              fontSize: 15,
              color: "#A39E99",
              paddingLeft: 24,
              marginTop: 8,
            }}>
              — from Paper Maps
            </p>
          </div>
        </div>
      </div>

      {/* Badges & Labels */}
      <div>
        <h3 style={groupTitle}>Badges & Labels</h3>
        <p style={groupDesc}>Tags, stamps, and status indicators</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {badges.map((b) => (
            <span
              key={b.text}
              style={{
                fontFamily: "Kalam, cursive",
                fontSize: 15,
                fontWeight: 700,
                padding: "5px 14px",
                background: b.bg,
                color: b.color,
                border: b.outlined ? `1.5px solid ${b.color}` : "1.5px solid #8B7D6B",
                borderRadius: "8px",
                display: "inline-block",
              }}
            >
              {b.text}
            </span>
          ))}
        </div>

        {/* Stamps */}
        <div style={{ marginTop: 32, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {stamps.map((s) => (
            <div
              key={s.line1 + s.line2}
              style={{
                width: 120,
                height: 120,
                border: `3px dashed ${s.color}`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(${s.rotate}deg)`,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Kalam, cursive", fontSize: 14, color: s.color, fontWeight: 700 }}>
                  {s.line1}
                </p>
                <p style={{ fontFamily: "Kalam, cursive", fontSize: 14, color: s.color, fontWeight: 700 }}>
                  {s.line2}
                </p>
                <p style={{ fontFamily: "Kalam, cursive", fontSize: 9, color: s.color }}>
                  {s.line3}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  fontFamily: "Kalam, cursive",
  fontSize: 20,
  fontWeight: 700,
  padding: "12px 28px",
  cursor: "pointer",
};

const groupTitle: React.CSSProperties = {
  fontFamily: "Fraunces, serif",
  fontSize: 22,
  fontWeight: 600,
  color: "#2D2926",
  marginBottom: 4,
};

const groupDesc: React.CSSProperties = {
  fontFamily: "Kalam, cursive",
  fontSize: 16,
  color: "#6B6560",
  marginBottom: 20,
};
