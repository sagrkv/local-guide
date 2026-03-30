"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface MoodCollection {
  id: string;
  title: string;
  slug: string;
  icon?: string;
  itemCount?: number;
  _count?: { items: number };
}

interface MoodsSectionProps {
  cityId: string;
  citySlug: string;
  cityName?: string;
}

export default function MoodsSection({ cityId, citySlug }: MoodsSectionProps) {
  const [moods, setMoods] = useState<MoodCollection[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cityId) return;

    const controller = new AbortController();

    fetch(`${API_BASE}/cities/${cityId}/collections?type=mood`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch moods");
        return res.json();
      })
      .then((data) => {
        const list: MoodCollection[] = Array.isArray(data)
          ? data
          : data.collections || data.data || [];
        setMoods(list);
        setReady(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("MoodsSection fetch error:", err);
        }
        setReady(true);
      });

    return () => controller.abort();
  }, [cityId]);

  if (!ready || moods.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--c-primary, #1E3A5F)",
              color: "var(--c-text-on-primary, #FAFAF5)",
            }}
          >
            <Compass size={20} strokeWidth={1.5} />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{
              fontFamily: "var(--c-font-display)",
              color: "var(--c-text)",
            }}
          >
            What Kind of Day Is It?
          </h2>
        </div>

        {/* Horizontal scroll of mood cards */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6">
          {moods.map((mood) => {
            const spotCount =
              mood.itemCount ?? mood._count?.items ?? 0;

            return (
              <Link
                key={mood.id}
                href={`/explore/${citySlug}/collection/${mood.slug}`}
                className="shrink-0"
              >
                <div
                  className="group w-36 h-40 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Emoji icon */}
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform duration-300">
                    {mood.icon || "\u2728"}
                  </span>

                  {/* Title */}
                  <span
                    className="text-sm font-semibold text-center leading-tight px-3"
                    style={{
                      fontFamily: "var(--c-font-display)",
                      color: "var(--c-text)",
                    }}
                  >
                    {mood.title}
                  </span>

                  {/* Spot count */}
                  {spotCount > 0 && (
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--c-text-muted)" }}
                    >
                      {spotCount} {spotCount === 1 ? "spot" : "spots"}
                    </span>
                  )}
                </div>

                {/* Gold accent on hover */}
                <div
                  className="h-0.5 mx-4 mt-1 w-0 group-hover:w-[calc(100%-2rem)] transition-all duration-500 rounded-full"
                  style={{ backgroundColor: "var(--c-gold)" }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
