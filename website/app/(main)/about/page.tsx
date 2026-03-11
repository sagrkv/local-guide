"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
} from "@/components/visuals";

const howItWorks = [
  {
    step: "01",
    title: "AI Suggests",
    description:
      "We use AI to scan cities and generate an initial list of interesting places -- cafes, temples, viewpoints, restaurants, and hidden gems.",
    color: "#3B82F6",
  },
  {
    step: "02",
    title: "Humans Curate",
    description:
      "Locals review, refine, and add context. They remove the noise, verify quality, and add the places that only someone who lives there would know.",
    color: "#10B981",
  },
  {
    step: "03",
    title: "You Explore",
    description:
      "The result is a beautiful, themed map with hand-picked places and ready-made itineraries. Open it on your phone and go.",
    color: "#F59E0B",
  },
];

const stats = [
  { value: "10+", label: "Cities Mapped" },
  { value: "500+", label: "Curated Places" },
  { value: "50+", label: "Itineraries" },
  { value: "100%", label: "Free & Open" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <GeometricShapes
          variant="corner"
          className="top-20 right-0 opacity-40"
        />
        <GlowOrb
          className="top-0 right-1/4"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="bottom-0 left-10 hidden lg:block"
          rows={6}
          cols={10}
          gap={16}
          highlightPattern
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              About Local Guide
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl leading-relaxed">
              We are building the travel maps we wish existed -- curated by
              locals, themed for each city, and free for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 lg:py-24 relative">
        <TechLines variant="horizontal" className="top-1/2 opacity-20" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <span className="badge mb-4">The Problem</span>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Google Maps shows everything but helps with nothing
              </h2>
              <div className="space-y-4 text-[var(--gray-400)] text-lg leading-relaxed">
                <p>
                  You land in a new city. You open Google Maps. You see
                  thousands of pins -- restaurants with fake reviews, tourist
                  traps with paid placements, and no way to tell what is
                  actually worth your time.
                </p>
                <p>
                  Travel forums are outdated. Blog posts are SEO-stuffed
                  listicles. Instagram is beautiful but useless for navigation.
                  None of these tools help you experience a city the way a local
                  does.
                </p>
                <p className="text-white font-medium">
                  Every city deserves a better guide.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-red-500/10 to-[var(--gray-850)] border border-[var(--gray-700)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <CircuitPattern animated={false} opacity={0.15} />
                </div>
                <div className="relative z-10 text-center p-8">
                  <div className="text-6xl md:text-8xl font-bold text-[var(--gray-800)] mb-4">
                    1000+
                  </div>
                  <p className="text-[var(--gray-500)] text-lg">
                    pins on a typical Google Maps search
                  </p>
                  <p className="text-[var(--gray-600)] text-sm mt-2">
                    ...and none of them are helpful
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)] relative overflow-hidden">
        <GeometricShapes variant="scattered" className="opacity-20" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">Our Solution</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Human-curated, city-themed maps
            </h2>
            <p className="text-[var(--gray-400)] text-lg max-w-2xl mx-auto">
              Instead of showing everything, we show what matters. Each city
              gets a carefully curated map with places that locals genuinely
              recommend -- designed with the city&apos;s unique character.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="text-center"
              >
                <span className="text-4xl lg:text-5xl font-bold text-[var(--accent)]">
                  {stat.value}
                </span>
                <p className="text-[var(--gray-400)] mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 relative">
        <TechLines
          variant="vertical"
          className="right-0 opacity-20 hidden lg:block"
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              AI suggests. Humans curate. You explore.
            </h2>
            <p className="text-[var(--gray-400)] text-lg max-w-2xl mx-auto">
              The best of both worlds: AI efficiency with human taste and local
              knowledge.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="relative p-8 rounded-2xl bg-[var(--gray-850)] border border-[var(--gray-700)] group"
              >
                {/* Step number */}
                <div className="text-5xl font-bold text-[var(--gray-800)] mb-4 group-hover:text-[var(--gray-700)] transition-colors">
                  {item.step}
                </div>

                {/* Color indicator */}
                <div
                  className="w-8 h-1 rounded-full mb-4"
                  style={{ background: item.color }}
                />

                <h3 className="text-xl font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-[var(--gray-400)] text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <span className="badge mb-4">Open Source</span>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Why we build in the open
              </h2>
              <div className="space-y-4 text-[var(--gray-400)] text-lg leading-relaxed">
                <p>
                  Travel information is public knowledge. It should not be
                  locked behind paywalls or controlled by a single company.
                </p>
                <p>
                  By making Local Guide open source, we ensure that city data
                  belongs to the community. Anyone can verify the
                  recommendations, improve the maps, or fork the project for
                  their own city.
                </p>
                <p>
                  Transparency builds trust. When our code and data are public,
                  you can see exactly how we curate places and make decisions.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://github.com/sagrkv/local-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#0d1117] font-semibold text-sm hover:bg-gray-200 transition-colors"
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

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--gray-850)] border border-[var(--gray-700)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <CircuitPattern animated={false} opacity={0.15} />
                </div>
                <div className="absolute top-6 right-6">
                  <DotGrid
                    rows={5}
                    cols={5}
                    gap={12}
                    dotSize={1.5}
                    animated={false}
                    highlightPattern={false}
                  />
                </div>
                <div className="relative z-10 text-center p-8">
                  <svg
                    className="w-24 h-24 mx-auto text-white/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <p className="text-[var(--gray-500)] text-lg font-medium">
                    100% Open Source
                  </p>
                  <p className="text-[var(--gray-600)] text-sm mt-1">
                    MIT License
                  </p>
                </div>
                <GlowOrb
                  className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  color="var(--accent)"
                  size="md"
                  intensity="medium"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Add Your City */}
      <section className="py-16 lg:py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-12"
          >
            <span className="badge mb-4">Contribute</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Add your city
            </h2>
            <p className="text-[var(--gray-400)] text-lg max-w-2xl mx-auto">
              Know a city inside and out? Help us build its guide. Here is how
              contributors add new cities to Local Guide.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Fork the repo",
                description:
                  "Clone the repository and set up your local development environment. Everything you need is documented in the README.",
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                ),
              },
              {
                title: "Add city data",
                description:
                  "Create a new city configuration with places, categories, theme colors, and itineraries. Use our data templates.",
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
              },
              {
                title: "Open a PR",
                description:
                  "Submit a pull request with your city. We will review it, provide feedback, and merge it into the live platform.",
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                ),
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="p-6 rounded-2xl bg-[var(--gray-850)] border border-[var(--gray-700)] text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--gray-800)] border border-[var(--gray-700)] flex items-center justify-center text-[var(--accent)] mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--gray-400)] text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <CircuitPattern className="opacity-15" animated />
        <GlowOrb
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          color="var(--accent)"
          size="xl"
          intensity="low"
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to explore?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              Pick a city, open the map, and travel like a local. No account
              needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/explore"
                className="btn-primary text-lg px-8 py-4"
              >
                Explore Cities
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
                href="https://github.com/sagrkv/local-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Contribute on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
