"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CityStamp } from "@/components/paper";

interface HeroSectionProps {
  city: {
    name: string;
    slug: string;
    tagline?: string;
    theme?: unknown;
  };
  heroImage?: string;
  onSurpriseMe: () => void;
}

export default function HeroSection({
  city,
  heroImage,
  onSurpriseMe,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-end">
      {/* Background photo or gradient */}
      {heroImage ? (
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, var(--pm-primary, #1E3A5F) 0%, #0f2840 60%, var(--pm-paper, #FAFAF5) 100%)",
          }}
        />
      )}

      {/* City Stamp -- top right */}
      <div className="absolute top-6 right-6 z-20 opacity-60">
        <CityStamp cityName={city.name} size="lg" />
      </div>

      {/* Hero content -- bottom aligned */}
      <div className="relative z-10 w-full pb-16 pt-48 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight"
            style={{
              fontFamily: "var(--pm-font-display)",
              color: "#FAFAF5",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {city.name}
          </motion.h1>

          {city.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg md:text-xl mb-8 max-w-xl"
              style={{
                fontFamily: "var(--pm-font-body)",
                color: "rgba(250, 250, 245, 0.85)",
                lineHeight: 1.5,
              }}
            >
              {city.tagline}
            </motion.p>
          )}

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-start gap-3"
          >
            <Link
              href={`/explore/${city.slug}/map`}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--pm-accent, #D4A574)",
                color: "var(--pm-ink, #1A1A1A)",
                fontFamily: "var(--pm-font-body)",
              }}
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Explore Map
            </Link>
            <button
              onClick={onSurpriseMe}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[15px] font-semibold border-[1.5px] transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
              style={{
                borderColor: "rgba(250, 250, 245, 0.4)",
                color: "#FAFAF5",
                fontFamily: "var(--pm-font-body)",
                backgroundColor: "transparent",
              }}
            >
              Surprise Me
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
