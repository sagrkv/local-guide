"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useCity } from "@/lib/city-context";
import { useCulturalTheme } from "@/components/cultural";
import styles from "./print.module.css";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface POIItem {
  id: string;
  name: string;
  address?: string;
  shortDescription?: string;
  category: { id: string; name: string; emoji?: string; slug: string };
}

interface CategoryGroup {
  name: string;
  emoji?: string;
  pois: POIItem[];
}

function groupByCategory(pois: POIItem[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const poi of pois) {
    const key = poi.category.id;
    if (!groups.has(key)) {
      groups.set(key, { name: poi.category.name, emoji: poi.category.emoji, pois: [] });
    }
    groups.get(key)!.pois.push(poi);
  }
  return Array.from(groups.values());
}

function qrUrl(citySlug: string): string {
  const target = `https://papermaps.in/explore/${citySlug}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(target)}`;
}

export default function PrintMapPage() {
  const { city, loading: cityLoading } = useCity();
  const theme = useCulturalTheme();

  const [pois, setPois] = useState<POIItem[]>([]);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const hasPrinted = useRef(false);

  // Fetch published POIs
  useEffect(() => {
    if (!city?.id) return;
    fetch(`${API_BASE}/cities/${city.id}/pois?limit=200`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || json?.pois || json;
        if (Array.isArray(data)) setPois(data);
      })
      .catch(() => setPois([]));
  }, [city?.id]);

  // Capture MapLibre canvas as static image
  const captureMap = useCallback(async () => {
    if (!city || !mapRef.current) return;
    const { Map: MaplibreMap } = await import("maplibre-gl");
    const map = new MaplibreMap({
      container: mapRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [city.centerLng, city.centerLat],
      zoom: city.defaultZoom,
      interactive: false,
      preserveDrawingBuffer: true,
      attributionControl: false,
    });
    map.once("idle", () => {
      try {
        setMapImage(map.getCanvas().toDataURL("image/png"));
      } catch {
        setMapImage(null);
      } finally {
        map.remove();
        setReady(true);
      }
    });
  }, [city]);

  useEffect(() => {
    if (city && pois.length > 0 && !mapImage && !ready) captureMap();
  }, [city, pois, mapImage, ready, captureMap]);

  // Auto-print once content is ready
  useEffect(() => {
    if (!ready || hasPrinted.current) return;
    hasPrinted.current = true;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [ready]);

  if (cityLoading || !city) {
    return <div className={styles.loading}><p>Preparing your map...</p></div>;
  }

  const groups = groupByCategory(pois);
  let counter = 0;

  return (
    <>
      {/* Hidden container for MapLibre rendering */}
      <div ref={mapRef} style={{ position: "absolute", left: "-9999px", width: "800px", height: "500px" }} />

      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.cityName}>{city.name}</h1>
            {city.tagline && <p className={styles.tagline}>{city.tagline}</p>}
          </div>
          <span className={styles.brand}>Paper Maps</span>
        </header>

        {/* Map image */}
        <section className={styles.mapSection}>
          {mapImage ? (
            <img src={mapImage} alt={`Map of ${city.name}`} className={styles.mapImage} />
          ) : (
            <div className={styles.mapPlaceholder}>
              <p>Map preview unavailable &mdash; visit the digital map online</p>
            </div>
          )}
        </section>

        {/* Legend */}
        <section className={styles.legend}>
          <h2 className={styles.legendTitle}>Legend</h2>
          <div className={styles.legendGrid}>
            {groups.map((group) => (
              <div key={group.name} className={styles.categoryGroup}>
                <h3 className={styles.categoryName}>
                  {group.emoji && <span>{group.emoji}</span>}
                  {group.name}
                </h3>
                <ul className={styles.poiList}>
                  {group.pois.map((poi) => {
                    counter += 1;
                    return (
                      <li key={poi.id} className={styles.poiItem}>
                        <span
                          className={styles.poiNumber}
                          style={{ borderColor: theme.palette.primary, color: theme.palette.primary }}
                        >
                          {counter}
                        </span>
                        <span>
                          <span className={styles.poiName}>{poi.name}</span>
                          {poi.address && (
                            <span className={styles.poiAddress}> &mdash; {poi.address}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Footer with QR */}
        <footer className={styles.footer}>
          <img src={qrUrl(city.slug)} alt="QR code" className={styles.qr} width={100} height={100} />
          <div>
            <p className={styles.footerCta}>Scan for the digital map</p>
            <p className={styles.footerUrl}>papermaps.in/explore/{city.slug}</p>
          </div>
        </footer>

        {/* Screen-only controls (hidden when printing) */}
        <div className={styles.screenOnly}>
          {!ready && <p className={styles.status}>Preparing print layout...</p>}
          <button type="button" onClick={() => window.print()} className={styles.triggerBtn}>
            Print this page
          </button>
          <a href={`/explore/${city.slug}/map`} className={styles.backLink}>Back to map</a>
        </div>
      </div>
    </>
  );
}
