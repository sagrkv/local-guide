import type { Metadata } from "next";
import { CityProvider } from "@/lib/city-context";
import { CulturalProvider } from "@/components/cultural";
import { getThemePreset, mergeThemeWithOverrides } from "@/lib/cultural-theme";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

async function fetchCity(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/cities/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await fetchCity(citySlug);

  if (!city) {
    return {
      title: "City Not Found",
    };
  }

  const presetId = city.theme?.themePresetId || citySlug;
  const preset = getThemePreset(presetId);
  const title = `${city.name} — Local Guide`;
  const description =
    city.tagline || preset.tagline || `Explore curated places and itineraries in ${city.name}`;
  const primaryColor = city.theme?.colorPrimary || "#1E3A5F";
  const ogUrl = `/api/og?title=${encodeURIComponent(city.name)}&subtitle=${encodeURIComponent(description)}&color=${encodeURIComponent(primaryColor)}`;

  return {
    title: city.name,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: city.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;

  // Fetch city from API to get DB theme overrides
  const city = await fetchCity(citySlug);
  const presetId = city?.theme?.themePresetId || citySlug;
  const baseTheme = getThemePreset(presetId);
  const culturalTheme = mergeThemeWithOverrides(baseTheme, city?.theme);

  return (
    <CulturalProvider theme={culturalTheme} className="min-h-screen">
      <CityProvider citySlug={citySlug}>
        {children}
      </CityProvider>
    </CulturalProvider>
  );
}
