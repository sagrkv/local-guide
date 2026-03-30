"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface SeasonalCollection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  activeMonthStart?: number;
  activeMonthEnd?: number;
  itemCount?: number;
  _count?: { items: number };
}

interface SeasonalSectionProps {
  cityId: string;
  citySlug: string;
  cityName?: string;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthRange(start?: number, end?: number): string {
  if (start == null || end == null) return "";
  const s = MONTH_NAMES[start - 1] ?? "";
  const e = MONTH_NAMES[end - 1] ?? "";
  if (!s || !e) return "";
  return s === e ? s : `${s} \u2013 ${e}`;
}

export default function SeasonalSection({ cityId, citySlug, cityName }: SeasonalSectionProps) {
  const [seasonals, setSeasonals] = useState<SeasonalCollection[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cityId) return;
    const controller = new AbortController();
    const currentMonth = new Date().getMonth() + 1;
    fetch(`${API_BASE}/cities/${cityId}/collections?type=seasonal&activeMonth=${currentMonth}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch seasonal content");
        return res.json();
      })
      .then((data) => {
        const list: SeasonalCollection[] = Array.isArray(data)
          ? data
          : data.collections || data.data || [];
        setSeasonals(list);
        setReady(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("SeasonalSection:", err);
        setReady(true);
      });
    return () => controller.abort();
  }, [cityId]);

  if (!ready || seasonals.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--c-primary, #1E3A5F)", color: "var(--c-text-on-primary, #FAFAF5)" }}
          >
            <Calendar size={20} strokeWidth={1.5} />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "var(--c-font-display)", color: "var(--c-text)" }}
          >
            {cityName ? `Right Now in ${cityName}` : "Right Now"}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {seasonals.map((item) => {
            const spots = item.itemCount ?? item._count?.items ?? 0;
            const range = monthRange(item.activeMonthStart, item.activeMonthEnd);
            return (
              <Link key={item.id} href={`/explore/${citySlug}/collection/${item.slug}`}>
                <div
                  className="group relative rounded-2xl overflow-hidden p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--c-gold, #D4A574)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                >
                  {/* Subtle dot pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, var(--c-deep, #0D1B2A) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                  />
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {item.icon && <span className="text-2xl leading-none">{item.icon}</span>}
                      {range && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(0,0,0,0.12)", color: "var(--c-deep, #0D1B2A)" }}
                        >
                          {range}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold leading-tight" style={{ fontFamily: "var(--c-font-display)", color: "var(--c-deep, #0D1B2A)" }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm leading-relaxed max-w-lg line-clamp-2" style={{ fontFamily: "var(--c-font-body)", color: "var(--c-deep, #0D1B2A)", opacity: 0.75 }}>
                        {item.description}
                      </p>
                    )}
                    {spots > 0 && (
                      <span className="text-xs font-semibold" style={{ color: "var(--c-deep, #0D1B2A)", opacity: 0.6 }}>
                        {spots} {spots === 1 ? "spot" : "spots"} to explore
                      </span>
                    )}
                  </div>
                  {/* Hover arrow */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-300" style={{ color: "var(--c-deep, #0D1B2A)" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
