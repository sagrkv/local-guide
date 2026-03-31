"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";

// ============================================
// TYPES
// ============================================
interface City {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  poiCount?: number;
  primaryColor?: string;
}

// ============================================
// STATIC FALLBACK DATA
// ============================================
const FALLBACK_CITIES: City[] = [
  {
    id: "1",
    name: "Mysore",
    slug: "mysore",
    tagline: "City of Palaces",
    poiCount: 45,
    primaryColor: "#8B6914",
  },
  {
    id: "2",
    name: "Bangalore",
    slug: "bangalore",
    tagline: "Garden City",
    poiCount: 62,
    primaryColor: "#2D6A4F",
  },
  {
    id: "3",
    name: "Hampi",
    slug: "hampi",
    tagline: "Ruins & Boulders",
    poiCount: 38,
    primaryColor: "#B85C38",
  },
  {
    id: "4",
    name: "Coorg",
    slug: "coorg",
    tagline: "Scotland of India",
    poiCount: 28,
    primaryColor: "#2D5F2D",
  },
  {
    id: "5",
    name: "Goa",
    slug: "goa",
    tagline: "Sun, Sand & Soul",
    poiCount: 55,
    primaryColor: "#1E6091",
  },
  {
    id: "6",
    name: "Pondicherry",
    slug: "pondicherry",
    tagline: "French Quarter Charm",
    poiCount: 32,
    primaryColor: "#C2703E",
  },
];

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView && count === 0) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, count, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ============================================
// FEATURE CARD COMPONENT
// ============================================
function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative p-6 rounded-2xl border border-[var(--pm-accent)]/30 hover:border-[var(--pm-accent)]/60 transition-all duration-300"
      style={{ background: 'var(--pm-surface)' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--pm-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl border border-[var(--pm-accent)]/20 flex items-center justify-center text-[var(--pm-accent)] mb-4 group-hover:scale-110 transition-transform duration-300" style={{ background: 'color-mix(in srgb, var(--pm-accent) 8%, var(--pm-paper))' }}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--pm-ink)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--pm-muted)' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// CITY CARD COMPONENT
// ============================================
function CityCard({ city, index }: { city: City; index: number }) {
  const color = city.primaryColor || "#1E3A5F";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/explore/${city.slug}`}
        className="group block relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden h-full hover:-translate-y-0.5"
        style={{
          background: 'var(--pm-surface)',
          borderColor: `${color}30`,
        }}
      >
        {/* Color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: color }}
        />

        <div className="relative">
          {/* City icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}12`, border: `1.5px solid ${color}25` }}
          >
            <svg
              className="w-5 h-5"
              style={{ color }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--pm-ink)' }}>
            {city.name}
          </h3>
          {city.tagline && (
            <p className="text-sm mb-3" style={{ color: 'var(--pm-muted)' }}>
              {city.tagline}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--pm-muted)' }}>
              {city.poiCount ? `${city.poiCount} places` : "Coming soon"}
            </span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-all duration-300"
              style={{ color: 'var(--pm-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================
// FAQ ITEM COMPONENT
// ============================================
function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b"
      style={{ borderColor: 'color-mix(in srgb, var(--pm-ink) 12%, transparent)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-medium pr-8" style={{ color: 'var(--pm-ink)' }}>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl shrink-0"
          style={{ color: 'var(--pm-muted)' }}
        >
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm leading-relaxed" style={{ color: 'var(--pm-muted)' }}>
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("/api/v1/cities?status=PUBLISHED", {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCities(
            data.map((c: Record<string, unknown>) => ({
              id: String(c.id || ""),
              name: String(c.name || ""),
              slug: String(c.slug || ""),
              tagline: c.tagline ? String(c.tagline) : undefined,
              poiCount:
                typeof c.poiCount === "number" ? c.poiCount : undefined,
              primaryColor: c.primaryColor
                ? String(c.primaryColor)
                : undefined,
            }))
          );
        }
      } catch {
        // Silently fall back to static data
      }
    };
    fetchCities();
  }, []);

  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      title: "Curated Maps",
      description:
        "Every city gets a hand-crafted map with places chosen by people, not algorithms. No sponsored pins. No star ratings. Just the spots that matter.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: "City-Themed Design",
      description:
        "Each city has its own visual identity -- colors, typography, and character. Mysore looks different from Goa. Because they are different.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Ready-Made Itineraries",
      description:
        "One-day, two-day, or weekend routes made by people who actually live there. Follow the route. Enjoy the city.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Mobile-First",
      description:
        "Open the map on your phone. Walk around. Find the next spot. Paper Maps works where it matters -- in your hand, on the street.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Free, Forever",
      description:
        "No subscriptions. No paywalls. No catch. Every map and itinerary is free to use. We believe travel knowledge should not cost money.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "Human Curation",
      description:
        "AI helps us find places. Humans decide what makes the cut. No business pays for placement. If it is on the map, someone real vouches for it.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Pick a City",
      description:
        "Browse our growing collection of curated city guides. Each one is made with care by people who actually know the place.",
    },
    {
      number: "02",
      title: "Open the Map",
      description:
        "Hand-picked cafes, temples, viewpoints, and hidden gems -- placed on a beautiful map. No clutter. No noise.",
    },
    {
      number: "03",
      title: "Go Explore",
      description:
        "Follow a ready-made itinerary or wander on your own. Pull up the map on your phone and go.",
    },
  ];

  const faqs = [
    {
      question: "Is Paper Maps really free?",
      answer:
        "Yes. Free, forever. All maps, curated places, and itineraries are available without payment or accounts. Travel knowledge should not cost money.",
    },
    {
      question: "How are places selected?",
      answer:
        "AI helps us discover places. Humans decide what makes the cut. We don't accept paid listings or sponsored placements. If a place is on our map, someone who actually knows the city vouches for it.",
    },
    {
      question: "Which cities are available?",
      answer:
        "We are starting with cities across India and expanding continuously. Each city gets a curated map, categorized places, and at least one ready-made itinerary.",
    },
    {
      question: "Can I suggest a place or city?",
      answer:
        "Yes. We welcome suggestions from locals and travelers. Reach out through the contact page or contribute directly on GitHub.",
    },
    {
      question: "Do I need an account?",
      answer:
        "No. Just open a map and start exploring. No sign-up, no login, no friction.",
    },
    {
      question: "What makes this different from Google Maps?",
      answer:
        "Google Maps shows everything. Paper Maps shows what matters. No algorithms deciding what you see. No sponsored pins. No fake reviews. Just honest, human-curated recommendations.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Used the Mysore map for our weekend trip and discovered amazing cafes and viewpoints we never would have found on Google Maps. Felt like a local.",
      author: "Ananya R.",
      role: "Travel Blogger",
    },
    {
      quote:
        "The itineraries are perfect -- no planning needed. Just followed the one-day Goa route and had the best day. The hidden beach recommendation was unreal.",
      author: "Karthik V.",
      role: "Weekend Traveler",
    },
    {
      quote:
        "Finally, a travel guide that doesn't feel like an advertisement. Real places, real recommendations. This is how travel apps should work.",
      author: "Meera S.",
      role: "Solo Traveler",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--pm-paper)' }}>
      {/* ==================== HERO SECTION ==================== */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--pm-paper)' }}
      >
        {/* Subtle warm radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[150px] opacity-30" style={{ background: 'var(--pm-accent)' }} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 container text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 12%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 30%, transparent)',
                color: 'color-mix(in srgb, var(--pm-accent) 80%, var(--pm-ink))',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--pm-accent)' }} />
              Free, forever
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance"
            style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
          >
            The anti-
            <br />
            <span style={{ color: 'var(--pm-accent)' }}>Google Maps.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--pm-muted)' }}
          >
            Beautifully curated city guides. Hand-picked by locals.{" "}
            <span style={{ color: 'var(--pm-ink)' }}>No algorithms, no ads, no star ratings.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--pm-ink)',
                color: 'var(--pm-paper)',
              }}
            >
              Explore a City
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-lg font-medium transition-all duration-200"
              style={{
                border: '1.5px solid color-mix(in srgb, var(--pm-ink) 20%, transparent)',
                color: 'var(--pm-ink)',
              }}
            >
              How It Works
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
          >
            {[
              { value: 12, suffix: "+", label: "Cities Mapped" },
              { value: 500, suffix: "+", label: "Curated Places" },
              { value: 100, suffix: "%", label: "Free Forever" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--pm-ink)' }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm" style={{ color: 'var(--pm-muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 rounded-full flex justify-center p-2"
            style={{ borderColor: 'color-mix(in srgb, var(--pm-ink) 20%, transparent)' }}
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 rounded-full"
              style={{ background: 'var(--pm-muted)' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== CITY GRID SECTION ==================== */}
      <section className="section relative" style={{ background: 'var(--pm-surface)' }}>
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                color: 'var(--pm-muted)',
              }}
            >Cities</span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              Pick a city.
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>Start exploring.</span>
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--pm-muted)' }}>
              Each city has its own curated map, hand-picked places, and
              ready-made itineraries. No sign-up required.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city, index) => (
              <CityCard key={city.id} city={city} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              href="/explore"
              className="px-8 py-3 inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200"
              style={{
                border: '1.5px solid color-mix(in srgb, var(--pm-ink) 20%, transparent)',
                color: 'var(--pm-ink)',
              }}
            >
              View All Cities
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section className="section relative" style={{ background: 'var(--pm-paper)' }}>
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                color: 'var(--pm-muted)',
              }}
            >Why Paper Maps</span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              What makes this
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>different</span>
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--pm-muted)' }}>
              No algorithms. No sponsored pins. No star ratings.
              Just human taste and local knowledge.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS SECTION ==================== */}
      <section id="how-it-works" className="section relative" style={{ background: 'var(--pm-surface)' }}>
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                color: 'var(--pm-muted)',
              }}
            >How It Works</span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              How it
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px"
                    style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--pm-ink) 15%, transparent), transparent)' }}
                  />
                )}

                <div className="text-6xl font-bold mb-4" style={{ color: 'color-mix(in srgb, var(--pm-accent) 25%, var(--pm-paper))' }}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--pm-ink)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--pm-muted)' }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      <section className="section relative" style={{ background: 'var(--pm-paper)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                color: 'var(--pm-muted)',
              }}
            >Testimonials</span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              What travelers
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>are saying</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl border"
                style={{
                  background: 'var(--pm-surface)',
                  borderColor: 'color-mix(in srgb, var(--pm-accent) 20%, transparent)',
                }}
              >
                <div className="text-4xl mb-4" style={{ color: 'var(--pm-accent)' }}>
                  &ldquo;
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: 'var(--pm-ink)', opacity: 0.8 }}>
                  {testimonial.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{
                      background: 'var(--pm-accent)',
                      color: 'var(--pm-paper)',
                    }}
                  >
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--pm-ink)' }}>
                      {testimonial.author}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--pm-muted)' }}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== OPEN SOURCE SECTION ==================== */}
      <section className="section relative" style={{ background: 'var(--pm-surface)' }}>
        <div className="container relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
                style={{
                  background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                  border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                  color: 'var(--pm-muted)',
                }}
              >Open Source</span>
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
              >
                Built in
                <br />
                <span style={{ color: 'var(--pm-accent)' }}>the open</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg leading-relaxed" style={{ color: 'var(--pm-muted)' }}>
                Paper Maps is open source. Travel information should not be
                locked behind paywalls or controlled by a single company. Our
                code and data are public. Contributions welcome.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-8 md:p-12 rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--pm-paper)',
                borderColor: 'color-mix(in srgb, var(--pm-ink) 10%, transparent)',
              }}
            >

              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <svg
                      className="w-8 h-8"
                      style={{ color: 'var(--pm-ink)' }}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="font-semibold text-lg" style={{ color: 'var(--pm-ink)' }}>
                      summar-studios/paper-maps
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--pm-muted)' }}>
                    The entire platform -- frontend, backend, city data, and map
                    configurations -- lives in a single repository. Fork it, run
                    it locally, contribute a city, or improve the code.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://github.com/summar-studios/paper-maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                      style={{ background: 'var(--pm-ink)', color: 'var(--pm-paper)' }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Star on GitHub
                    </a>
                    <a
                      href="https://github.com/summar-studios/paper-maps#contributing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border font-semibold text-sm transition-colors"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--pm-ink) 20%, transparent)',
                        color: 'var(--pm-ink)',
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Contribute a City
                    </a>
                  </div>
                </div>

                {/* Visual element */}
                <div className="hidden md:flex flex-col items-center justify-center">
                  <div className="space-y-3 w-full max-w-xs">
                    {[
                      { label: "Next.js + React", color: "#61DAFB" },
                      { label: "Fastify + Prisma", color: "#10B981" },
                      { label: "TypeScript", color: "#3178C6" },
                      { label: "Tailwind CSS", color: "#38BDF8" },
                    ].map((tech, i) => (
                      <motion.div
                        key={tech.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
                        style={{
                          background: 'var(--pm-surface)',
                          borderColor: 'color-mix(in srgb, var(--pm-ink) 10%, transparent)',
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: tech.color }}
                        />
                        <span className="text-sm" style={{ color: 'var(--pm-ink)', opacity: 0.7 }}>
                          {tech.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section relative" style={{ background: 'var(--pm-paper)' }}>
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{
                background: 'color-mix(in srgb, var(--pm-accent) 10%, var(--pm-paper))',
                border: '1px solid color-mix(in srgb, var(--pm-accent) 25%, transparent)',
                color: 'var(--pm-muted)',
              }}
            >FAQ</span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              Frequently asked
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>questions</span>
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="section relative overflow-hidden" style={{ background: 'var(--pm-surface)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20" style={{ background: 'var(--pm-accent)' }} />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: 'var(--pm-ink)', fontFamily: 'var(--pm-font-display)' }}
            >
              Ready to explore
              <br />
              <span style={{ color: 'var(--pm-accent)' }}>your next city?</span>
            </h2>
            <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--pm-muted)' }}>
              Pick a city. Open the map. No sign-up. No catch. Just go.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--pm-ink)', color: 'var(--pm-paper)' }}
              >
                Explore a City
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <a
                href="https://github.com/summar-studios/paper-maps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-lg font-medium transition-all duration-200"
                style={{
                  border: '1.5px solid color-mix(in srgb, var(--pm-ink) 20%, transparent)',
                  color: 'var(--pm-ink)',
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
