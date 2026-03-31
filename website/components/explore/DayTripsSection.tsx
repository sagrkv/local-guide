"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface DayTripCollection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  travelTime?: string;
  itemCount?: number;
  _count?: { items: number };
}

interface DayTripsSectionProps {
  cityId: string;
  citySlug: string;
  cityName?: string;
}

export default function DayTripsSection({ cityId, citySlug }: DayTripsSectionProps) {
  const [trips, setTrips] = useState<DayTripCollection[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cityId) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/cities/${cityId}/collections?type=day_trip`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch day trips");
        return res.json();
      })
      .then((data) => {
        const list: DayTripCollection[] = Array.isArray(data)
          ? data
          : data.collections || data.data || [];
        setTrips(list);
        setReady(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("DayTripsSection:", err);
        setReady(true);
      });
    return () => controller.abort();
  }, [cityId]);

  if (!ready || trips.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--pm-primary, #1E3A5F)", color: "var(--pm-paper, #FAFAF5)" }}
          >
            <MapPin size={20} strokeWidth={1.5} />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "var(--pm-font-display)", color: "var(--pm-ink)" }}
          >
            Beyond the City
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {trips.map((trip) => {
            const spots = trip.itemCount ?? trip._count?.items ?? 0;
            return (
              <Link key={trip.id} href={`/explore/${citySlug}/collection/${trip.slug}`}>
                <div
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: "var(--pm-surface)", border: "1px solid var(--pm-muted)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                >
                  <div className="relative h-44 overflow-hidden">
                    {trip.coverImageUrl ? (
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--pm-primary, #1E3A5F)20, var(--pm-accent, #D4A574)20)" }}>
                        <MapPin size={32} strokeWidth={1.5} style={{ color: "var(--pm-muted)" }} />
                      </div>
                    )}
                    {trip.travelTime && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#FAFAF5" }}>
                        <Clock size={12} strokeWidth={2} />
                        {trip.travelTime}
                      </span>
                    )}
                    <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(to top, var(--pm-surface), transparent 50%)" }} />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold leading-tight mb-1" style={{ fontFamily: "var(--pm-font-display)", color: "var(--pm-ink)" }}>
                      {trip.title}
                    </h3>
                    {spots > 0 && (
                      <span className="text-xs font-medium block mb-2" style={{ color: "var(--pm-muted)" }}>
                        {spots} {spots === 1 ? "spot" : "spots"}
                      </span>
                    )}
                    {trip.description && (
                      <p className="text-sm line-clamp-2 leading-relaxed" style={{ fontFamily: "var(--pm-font-body)", color: "var(--pm-muted)" }}>
                        {trip.description}
                      </p>
                    )}
                  </div>
                  <div className="h-0.5 w-0 group-hover:w-full transition-all duration-500" style={{ backgroundColor: "var(--pm-accent)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
