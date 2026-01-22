"use client";

import { useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";

// Lazy load experiment components
const ParticleField = lazy(() => import("@/components/experiments/ParticleField"));
const LiquidDistortion = lazy(() => import("@/components/experiments/LiquidDistortion"));
const InfiniteTunnel = lazy(() => import("@/components/experiments/InfiniteTunnel"));
const AudioVisualizer = lazy(() => import("@/components/experiments/AudioVisualizer"));
const MorphTargets = lazy(() => import("@/components/experiments/MorphTargets"));

// Experiments data
const experiments = [
  {
    id: "particle-field",
    title: "Particle Field",
    description:
      "100,000 particles responding to mouse movement. Built with Three.js and custom GLSL shaders using GPGPU techniques.",
    tags: ["Three.js", "GPGPU", "Shaders"],
    date: "January 2026",
    color: "#FF9500",
    Component: ParticleField,
  },
  {
    id: "liquid-distortion",
    title: "Liquid Distortion",
    description:
      "Image distortion effect using noise-based displacement. Hover to interact with the fluid simulation.",
    tags: ["Shaders", "WebGL", "Interactive"],
    date: "January 2026",
    color: "#3B82F6",
    Component: LiquidDistortion,
  },
  {
    id: "infinite-tunnel",
    title: "Infinite Tunnel",
    description:
      "Procedurally generated infinite tunnel with dynamic lighting and post-processing effects.",
    tags: ["Three.js", "Procedural", "Animation"],
    date: "December 2025",
    color: "#10B981",
    Component: InfiniteTunnel,
  },
  {
    id: "audio-visualizer",
    title: "Audio Visualizer",
    description:
      "Real-time audio visualization using Web Audio API and Three.js geometry manipulation.",
    tags: ["Audio Reactive", "Three.js", "WebAudio"],
    date: "December 2025",
    color: "#8B5CF6",
    Component: AudioVisualizer,
  },
  {
    id: "morph-targets",
    title: "Morph Targets",
    description:
      "Smooth morphing between geometric shapes using vertex animation and easing functions.",
    tags: ["Three.js", "Animation", "Geometry"],
    date: "November 2025",
    color: "#EF4444",
    Component: MorphTargets,
  },
];

const allTags = ["All", "Three.js", "Shaders", "GPGPU", "Audio Reactive", "Procedural"];

export default function LabsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);

  const filteredExperiments =
    activeFilter === "All"
      ? experiments
      : experiments.filter((exp) => exp.tags.includes(activeFilter));

  const ActiveComponent = activeExperiment
    ? experiments.find((exp) => exp.id === activeExperiment)?.Component
    : null;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Labs
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl leading-relaxed mb-4">
              Experiments, prototypes, and creative coding explorations. This is
              where we push boundaries and play with new tech.
            </p>
            <p className="text-[var(--gray-500)] max-w-2xl">
              Not everything we build is for clients. Sometimes we make things
              just because we can—to learn, to experiment, to see what's
              possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tags */}
      <section className="py-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === tag
                    ? "bg-[var(--accent)] text-[var(--background)]"
                    : "bg-[var(--gray-800)] text-[var(--gray-400)] hover:text-white border border-[var(--gray-700)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Experiments Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredExperiments.map((experiment, index) => (
                <motion.article
                  key={experiment.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="group cursor-pointer"
                  onClick={() => setActiveExperiment(experiment.id)}
                >
                  <div className="bg-[var(--gray-800)] rounded-2xl overflow-hidden border border-[var(--gray-700)] hover:border-[var(--accent)]/30 transition-all duration-300">
                    {/* Canvas Preview */}
                    <div
                      className="aspect-[4/3] relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${experiment.color}15 0%, ${experiment.color}05 100%)`,
                      }}
                    >
                      <Suspense
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                          </div>
                        }
                      >
                        <experiment.Component preview />
                      </Suspense>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--accent)] text-[var(--background)] px-4 py-2 rounded-full text-sm font-semibold">
                          Launch Demo
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {experiment.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full bg-[var(--gray-700)] text-[var(--gray-400)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors mb-2">
                        {experiment.title}
                      </h3>
                      <p className="text-[var(--gray-500)] text-sm mb-3 line-clamp-2">
                        {experiment.description}
                      </p>
                      <span className="text-xs text-[var(--gray-600)]">
                        {experiment.date}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Full-Screen Demo Modal */}
      <AnimatePresence>
        {activeExperiment && ActiveComponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--background)]"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveExperiment(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--gray-800)] border border-[var(--gray-700)] flex items-center justify-center text-white hover:bg-[var(--gray-700)] transition-colors"
              aria-label="Close demo"
            >
              ✕
            </button>

            {/* Experiment Info */}
            <div className="absolute bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-auto z-50 p-4 md:p-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-none md:max-w-md">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                {experiments.find((e) => e.id === activeExperiment)?.title}
              </h2>
              <p className="text-[var(--gray-400)] text-xs md:text-sm line-clamp-2 md:line-clamp-none">
                {experiments.find((e) => e.id === activeExperiment)?.description}
              </p>
            </div>

            {/* Full-Screen Canvas */}
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ActiveComponent />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-[var(--gray-900)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Want something experimental?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              We bring the same creative energy to client work. If you're
              looking for something that stands out, let's talk.
            </p>
            <Button href="/contact" size="lg">
              Start a Project
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
