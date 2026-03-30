"use client";

import Image from "next/image";
import Link from "next/link";
import type { NearbyPOI } from "./types";

interface Props {
  nearby: NearbyPOI[];
  citySlug: string;
}

export function NearbySpots({ nearby, citySlug }: Props) {
  if (nearby.length === 0) return null;

  return (
    <div className="mt-12">
      <h2
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--pm-muted)" }}
      >
        Nearby Spots
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide">
        {nearby.map((n) => {
          const nPhoto = n.primaryPhotoUrl || n.photos?.[0]?.url;
          return (
            <Link
              key={n.id}
              href={`/explore/${citySlug}/poi/${n.slug}`}
              className="flex-shrink-0 w-40 snap-start rounded-xl overflow-hidden transition-transform active:scale-[0.97]"
              style={{
                background: "var(--pm-surface)",
                border:
                  "1px solid color-mix(in srgb, var(--pm-muted) 15%, transparent)",
              }}
            >
              <div className="relative w-full h-24">
                {nPhoto ? (
                  <Image
                    src={nPhoto}
                    alt={n.name}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--pm-primary), var(--pm-accent))",
                      opacity: 0.15,
                    }}
                  />
                )}
              </div>
              <div className="p-2.5">
                {n.category && (
                  <p
                    className="text-[10px] font-medium uppercase tracking-wider mb-0.5"
                    style={{ color: "var(--pm-muted)" }}
                  >
                    {n.category.emoji ? `${n.category.emoji} ` : ""}
                    {n.category.name}
                  </p>
                )}
                <p
                  className="text-sm font-semibold leading-tight line-clamp-2"
                  style={{ color: "var(--pm-ink)" }}
                >
                  {n.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
