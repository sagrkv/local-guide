"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { InkDivider } from "@/components/paper/InkDivider";
import { SurpriseMe } from "@/components/explore/SurpriseMe";
import HeroSection from "@/components/explore/HeroSection";
import MoodsSection from "@/components/explore/MoodsSection";
import ItinerariesSection from "@/components/explore/ItinerariesSection";
import DayTripsSection from "@/components/explore/DayTripsSection";
import SeasonalSection from "@/components/explore/SeasonalSection";
import LocalsWeekSection from "@/components/explore/LocalsWeekSection";
import AllSpotsSection from "@/components/explore/AllSpotsSection";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface POI {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  localTip?: string;
  latitude: number;
  longitude: number;
  priority: string;
  primaryPhotoUrl?: string;
  categoryName?: string;
  categoryEmoji?: string;
  category?: { name: string; emoji?: string };
  photos?: Array<{ url: string }>;
}

interface Itinerary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  durationMinutes?: number;
  difficulty?: string;
  stopCount?: number;
  stops?: Array<{ poi?: { name: string } }>;
  _count?: { stops: number };
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color?: string;
  slug?: string;
  _count?: { pois: number };
}

// ---------------------------------------------------------------------------
// Loading & Error states
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--pm-paper, #FAFAF5)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--pm-accent, #D4A574)" }}
        />
        <p
          className="text-sm"
          style={{
            color: "var(--pm-muted, #9CA3AF)",
            fontFamily: "var(--pm-font-body)",
          }}
        >
          Loading city...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--pm-paper, #FAFAF5)" }}
    >
      <div className="text-center max-w-md px-6">
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            color: "var(--pm-ink, #1A1A1A)",
            fontFamily: "var(--pm-font-display)",
          }}
        >
          City not found
        </h1>
        <p className="mb-6" style={{ color: "var(--pm-muted, #9CA3AF)" }}>
          {error}
        </p>
        <Link
          href="/"
          className="font-medium hover:underline"
          style={{ color: "var(--pm-primary, #1E3A5F)" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CityLandingPage() {
  const { city, loading, error } = useCity();
  const [pois, setPois] = useState<POI[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPois, setTotalPois] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [surpriseOpen, setSurpriseOpen] = useState(false);

  useEffect(() => {
    if (!city?.id) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [poisRes, itinRes, catRes] = await Promise.allSettled([
          fetch(`${API_BASE}/cities/${city.id}/pois?limit=50`),
          fetch(`${API_BASE}/cities/${city.id}/itineraries?limit=6`),
          fetch(`${API_BASE}/cities/${city.id}/categories`),
        ]);

        if (poisRes.status === "fulfilled" && poisRes.value.ok) {
          const data = await poisRes.value.json();
          const list = Array.isArray(data)
            ? data
            : data.pois || data.data || [];
          setPois(list);
          setTotalPois(data.total ?? data.count ?? list.length);
        }
        if (itinRes.status === "fulfilled" && itinRes.value.ok) {
          const data = await itinRes.value.json();
          setItineraries(
            Array.isArray(data) ? data : data.itineraries || data.data || [],
          );
        }
        if (catRes.status === "fulfilled" && catRes.value.ok) {
          const data = await catRes.value.json();
          setCategories(
            Array.isArray(data) ? data : data.categories || data.data || [],
          );
        }
      } catch {
        // non-critical -- sections simply won't render
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [city?.id]);

  const handleSurpriseMe = useCallback(() => setSurpriseOpen(true), []);
  const handleCloseSurprise = useCallback(() => setSurpriseOpen(false), []);

  if (loading) return <LoadingSpinner />;
  if (error || !city) return <ErrorState error={error || "City not found"} />;

  const heroImage =
    city.heroImageUrl || (pois[0]?.primaryPhotoUrl ?? undefined);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--pm-paper, #FAFAF5)", colorScheme: "light" }}
    >
      {/* 1. Hero */}
      <HeroSection
        city={city}
        heroImage={heroImage}
        onSurpriseMe={handleSurpriseMe}
      />

      {/* 2. Moods */}
      {!dataLoading && city.id && (
        <MoodsSection cityId={city.id} citySlug={city.slug} />
      )}

      <InkDivider variant="wavy" className="my-4 max-w-5xl mx-auto px-6" seed={1} />

      {/* 3. Itineraries */}
      {!dataLoading && (
        <ItinerariesSection itineraries={itineraries} citySlug={city.slug} />
      )}

      {/* 4. Day Trips */}
      {!dataLoading && city.id && (
        <DayTripsSection cityId={city.id} citySlug={city.slug} />
      )}

      <InkDivider variant="dashed" className="my-4 max-w-5xl mx-auto px-6" seed={2} />

      {/* 5. Seasonal */}
      {!dataLoading && city.id && (
        <SeasonalSection
          cityId={city.id}
          citySlug={city.slug}
          cityName={city.name}
        />
      )}

      {/* 6. Local's Week */}
      {!dataLoading && city.id && (
        <LocalsWeekSection cityId={city.id} citySlug={city.slug} />
      )}

      <InkDivider variant="straight" className="my-4 max-w-5xl mx-auto px-6" seed={3} />

      {/* 7. All Spots */}
      {!dataLoading && (
        <AllSpotsSection
          categories={categories}
          citySlug={city.slug}
          totalCount={totalPois}
        />
      )}

      {/* Loading state */}
      {dataLoading && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--pm-accent, #D4A574)" }}
              />
              <span
                className="text-sm"
                style={{
                  color: "var(--pm-muted, #9CA3AF)",
                  fontFamily: "var(--pm-font-body)",
                }}
              >
                Loading places and itineraries...
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!dataLoading &&
        pois.length === 0 &&
        itineraries.length === 0 &&
        categories.length === 0 && (
          <section className="py-24">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <p
                className="text-lg"
                style={{
                  fontFamily: "var(--pm-font-display)",
                  color: "var(--pm-muted, #9CA3AF)",
                }}
              >
                Curated places and itineraries for {city.name} coming soon.
              </p>
            </div>
          </section>
        )}

      {/* Bottom flourish */}
      <div className="pb-12">
        <InkDivider variant="wavy" className="max-w-5xl mx-auto px-6" seed={4} />
      </div>

      {/* SurpriseMe overlay */}
      <SurpriseMe
        pois={pois}
        citySlug={city.slug}
        isOpen={surpriseOpen}
        onClose={handleCloseSurprise}
      />
    </div>
  );
}
