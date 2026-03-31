import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const title = searchParams.get("title") || "Paper Maps";
    const subtitle =
      searchParams.get("subtitle") || "Curated City Guides";
    const color = searchParams.get("color") || "#1E3A5F";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${color}, #1a1a2e)`,
            color: "white",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              left: "-80px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.03)",
            }}
          />

          {/* Logo badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #FF9500, #FF8C40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1a1a2e",
              }}
            >
              PM
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
              lineHeight: 1.1,
              maxWidth: "900px",
              padding: "0 40px",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              opacity: 0.8,
              textAlign: "center",
              maxWidth: "700px",
            }}
          >
            {subtitle}
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize: 18,
              marginTop: 48,
              opacity: 0.5,
              letterSpacing: "0.05em",
            }}
          >
            papermaps.in
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
