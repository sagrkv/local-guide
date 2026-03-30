"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { useFavorites } from "@/hooks/useFavorites";
import { use } from "react";
import type { POIDetail, NearbyPOI } from "./types";
import { getHeroUrl, getLat, getLng, getCatName, getCatEmoji, buildInfoTiles } from "./helpers";
import { NearbySpots } from "./NearbySpots";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export default function POIDetailPage({
  params,
}: {
  params: Promise<{ citySlug: string; poiSlug: string }>;
}) {
  const { citySlug, poiSlug } = use(params);
  const { city, loading: cityLoading } = useCity();
  const { isFavorite, toggle } = useFavorites();

  const [poi, setPoi] = useState<POIDetail | null>(null);
  const [nearby, setNearby] = useState<NearbyPOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch POI detail
  useEffect(() => {
    if (!city?.id) return;
    let cancelled = false;
    const fetchPOI = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/cities/${city.id}/pois/${poiSlug}`);
        if (!res.ok) throw new Error(res.status === 404 ? "Place not found" : "Failed to load");
        const json = await res.json();
        if (!cancelled) setPoi(json.data || json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load place");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPOI();
    return () => { cancelled = true; };
  }, [city?.id, poiSlug]);

  // Fetch nearby POIs (~500m bounding box)
  useEffect(() => {
    if (!poi || !city?.id) return;
    let cancelled = false;
    const lat = getLat(poi);
    const lng = getLng(poi);
    if (!lat && !lng) return;
    const delta = 0.005;
    const qs = new URLSearchParams({
      northLat: String(lat + delta), southLat: String(lat - delta),
      eastLng: String(lng + delta), westLng: String(lng - delta),
      limit: "6",
    });
    fetch(`${API_BASE}/cities/${city.id}/pois?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const items = (json.data || json.items || json.pois || []) as NearbyPOI[];
        setNearby(items.filter((p) => p.id !== poi.id).slice(0, 5));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [poi, city?.id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: poi?.name, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [poi?.name]);

  // --- Loading ---
  if (cityLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--pm-paper)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--pm-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--pm-muted)" }}>Loading place...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !poi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--pm-paper)" }}>
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--pm-ink)", fontFamily: "var(--pm-font-display)" }}>
            Place not found
          </h1>
          <p className="mb-6" style={{ color: "var(--pm-muted)" }}>{error || "We couldn't find this place."}</p>
          <Link href={`/explore/${citySlug}`} className="font-medium hover:underline" style={{ color: "var(--pm-primary)" }}>
            Back to {city?.name || "city"}
          </Link>
        </div>
      </div>
    );
  }

  const heroUrl = getHeroUrl(poi);
  const lat = getLat(poi);
  const lng = getLng(poi);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const favorited = isFavorite(poi.id);
  const catName = getCatName(poi);
  const catEmoji = getCatEmoji(poi);
  const localTip = poi.localTip;
  const warningNote = poi.warningNote || poi.warning;
  const infoTiles = buildInfoTiles(poi);

  return (
    <div className="min-h-screen" style={{ background: "var(--pm-paper)" }}>
      {/* 1. HERO PHOTO */}
      <div className="relative w-full h-[56vh] min-h-[320px] max-h-[520px]">
        {heroUrl ? (
          <>
            <Image src={heroUrl} alt={poi.name} fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.45) 100%)",
            }} />
          </>
        ) : (
          <div className="w-full h-full" style={{
            background: "linear-gradient(160deg, var(--pm-primary), color-mix(in srgb, var(--pm-accent) 40%, var(--pm-primary)))",
          }} />
        )}

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <Link href={`/explore/${citySlug}`}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/90 hover:bg-black/50 transition-colors"
            aria-label="Back">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button onClick={() => toggle(poi.id, citySlug)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}>
            <svg className={`w-5 h-5 ${favorited ? "text-red-500 fill-red-500" : "text-white/90"}`}
              viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* 2. HEADER overlaid on hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-16 z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {catName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                  {catEmoji && <span>{catEmoji}</span>}{catName}
                </span>
              )}
              {poi.priority === "MUST_VISIT" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/90 text-amber-950">Must Visit</span>
              )}
              {poi.priority === "HIDDEN_GEM" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-400/90 text-purple-950">Hidden Gem</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "var(--pm-font-display)" }}>{poi.name}</h1>
            {poi.shortDescription && (
              <p className="mt-2 text-sm md:text-base leading-relaxed text-white/85 max-w-lg"
                style={{ fontFamily: "var(--pm-font-body)" }}>{poi.shortDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT COLUMN */}
      <div className="max-w-2xl mx-auto px-5 pb-24">
        {/* 3. LOCAL TIP */}
        {localTip && (
          <div className="mt-8 p-5 rounded-xl relative overflow-hidden"
            style={{ background: "var(--pm-surface)", borderLeft: "3px solid var(--pm-accent)" }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--pm-accent)" }}>
              &#9998; Local Tip
            </p>
            <p className="text-base md:text-lg italic leading-relaxed relative"
              style={{ color: "var(--pm-ink)", fontFamily: "var(--pm-font-body)" }}>{localTip}</p>
          </div>
        )}

        {/* Warning */}
        {warningNote && (
          <div className="mt-4 p-4 rounded-xl border border-red-200" style={{ background: "#fef2f2" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-red-600">&#9888;&#65039; Heads Up</p>
            <p className="text-sm leading-relaxed text-red-800">{warningNote}</p>
          </div>
        )}

        {/* 4. LONG DESCRIPTION */}
        {poi.longDescription && (
          <div className="mt-8">
            <p className="text-base leading-[1.8] whitespace-pre-line"
              style={{ color: "var(--pm-ink)", fontFamily: "var(--pm-font-body)" }}>{poi.longDescription}</p>
          </div>
        )}

        {/* 5. PRACTICAL INFO */}
        {infoTiles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--pm-muted)" }}>
              Practical Info
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {infoTiles.map((tile) => (
                <div key={tile.label} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "var(--pm-surface)", border: "1px solid color-mix(in srgb, var(--pm-muted) 20%, transparent)" }}>
                  <span className="text-lg leading-none mt-0.5">{tile.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--pm-muted)" }}>{tile.label}</p>
                    <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "var(--pm-ink)" }}>{tile.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ACTIONS */}
        <div className="mt-10 flex gap-3">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: "var(--pm-primary)", color: "var(--pm-paper)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open in Google Maps
          </a>
          <button onClick={handleShare}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--pm-surface)", color: "var(--pm-ink)", border: "1px solid color-mix(in srgb, var(--pm-muted) 25%, transparent)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* 7. NEARBY SPOTS */}
        <NearbySpots nearby={nearby} citySlug={citySlug} />

        {/* Back link */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid color-mix(in srgb, var(--pm-muted) 15%, transparent)" }}>
          <Link href={`/explore/${citySlug}`} className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70"
            style={{ color: "var(--pm-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {city?.name || "city"}
          </Link>
        </div>
      </div>
    </div>
  );
}
