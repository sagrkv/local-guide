"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coffee } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface LocalsPOI { id: string; name: string; slug: string }
interface DayEntry { dayOfWeek: number; note?: string; poi?: LocalsPOI }
interface LocalsWeekCollection {
  id: string;
  title: string;
  slug: string;
  days?: DayEntry[];
  items?: Array<{ sortOrder?: number; note?: string; poi?: LocalsPOI }>;
}
interface LocalsWeekSectionProps { cityId: string; citySlug: string; cityName?: string }

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildDayEntries(week: LocalsWeekCollection): DayEntry[] {
  if (week.days && week.days.length > 0) {
    return [...week.days].sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)).slice(0, 7);
  }
  if (week.items && week.items.length > 0) {
    return [...week.items]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .slice(0, 7)
      .map((item, idx) => ({ dayOfWeek: idx, note: item.note, poi: item.poi }));
  }
  return [];
}

export default function LocalsWeekSection({ cityId, citySlug }: LocalsWeekSectionProps) {
  const [week, setWeek] = useState<LocalsWeekCollection | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cityId) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/cities/${cityId}/collections?type=locals_week`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch locals week");
        return res.json();
      })
      .then((data) => {
        const list: LocalsWeekCollection[] = Array.isArray(data)
          ? data
          : data.collections || data.data || [];
        setWeek(list.length > 0 ? list[0] : null);
        setReady(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("LocalsWeekSection:", err);
        setReady(true);
      });
    return () => controller.abort();
  }, [cityId]);

  if (!ready || !week) return null;
  const entries = buildDayEntries(week);
  if (entries.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--pm-primary, #1E3A5F)", color: "var(--pm-paper, #FAFAF5)" }}
          >
            <Coffee size={20} strokeWidth={1.5} />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "var(--pm-font-display)", color: "var(--pm-ink)" }}
          >
            A Week Like a Local
          </h2>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--pm-surface)", border: "1px solid var(--pm-muted)" }}
        >
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-baseline gap-4 px-5 py-4 md:px-6"
              style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--pm-muted)" : "none" }}
            >
              <span
                className="shrink-0 w-10 text-sm font-bold uppercase tracking-wide"
                style={{ fontFamily: "var(--pm-font-display)", color: "var(--pm-primary, #1E3A5F)" }}
              >
                {DAY_NAMES[i] ?? `Day ${i + 1}`}
              </span>
              <span
                className="flex-1 text-sm leading-relaxed"
                style={{ fontFamily: "var(--pm-font-body)", color: "var(--pm-ink)" }}
              >
                {entry.note || "\u2014"}
              </span>
              {entry.poi && (
                <Link
                  href={`/explore/${citySlug}/poi/${entry.poi.slug}`}
                  className="shrink-0 text-sm font-semibold hover:underline transition-colors duration-200"
                  style={{ color: "var(--pm-accent, #D4A574)", fontFamily: "var(--pm-font-body)" }}
                >
                  {entry.poi.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
