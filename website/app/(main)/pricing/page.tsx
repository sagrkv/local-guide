"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
} from "@/components/visuals";

const packages = [
  {
    id: 1,
    name: "Free",
    price: "₹0",
    priceShort: "Free",
    description: "Everything you need to explore any city",
    features: [
      "All curated city maps",
      "All hand-picked places",
      "All ready-made itineraries",
      "Mobile-friendly interface",
      "No account required",
      "No ads, no sponsored listings",
    ],
    timeline: "forever",
    color: "#10B981",
    popular: true,
  },
  {
    id: 2,
    name: "Contributor",
    price: "Free",
    priceShort: "Free",
    description: "Help grow the community",
    features: [
      "Everything in Free",
      "Suggest new places",
      "Rate and review spots",
      "Create custom itineraries",
      "Save favorite places",
      "Request new cities",
    ],
    timeline: "forever",
    color: "#3B82F6",
    popular: false,
  },
];

const faqs = [
  {
    question: "Is Paper Maps really free?",
    answer:
      "Yes, 100% free. No hidden costs, no premium tiers, no subscriptions. All maps and itineraries are available to everyone.",
  },
  {
    question: "How can I contribute?",
    answer:
      "Create a free account and start suggesting places, writing reviews, or requesting new cities. We review all contributions to maintain quality.",
  },
  {
    question: "How do you keep the lights on?",
    answer:
      "We are open source and community-supported. We may explore ethical sponsorships in the future, but will never add ads or paid listings.",
  },
  {
    question: "Can I use this for my travel business?",
    answer:
      "Yes! The maps and data are freely available. If you want to embed our maps or use our API, get in touch.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Background visuals */}
        <GeometricShapes variant="corner" className="top-20 left-0 opacity-40" />
        <GlowOrb
          className="top-0 left-1/3"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="top-20 right-10 hidden lg:block"
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
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Free Forever
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl mx-auto leading-relaxed">
              No subscriptions. No paywalls. Every map and itinerary is free
              to use.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Visual - Enhanced with circuit-board style */}
      <section className="py-8 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Timeline Line with animated pulse */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[2px] bg-[var(--gray-700)] -translate-y-1/2">
              {/* Animated pulse traveling along line */}
              <motion.div
                className="absolute h-full w-24 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
                animate={{ left: ["-10%", "110%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* Timeline Points - Enhanced with glow */}
            <div className="hidden lg:flex justify-between items-center relative">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.5 + index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="text-sm font-bold mb-4"
                    style={{ color: pkg.color }}
                  >
                    {pkg.priceShort}
                  </span>
                  <div className="relative">
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full blur-md"
                      style={{ background: pkg.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                    />
                    <div
                      className="w-5 h-5 rounded-full border-4 bg-[var(--background)] relative z-10"
                      style={{ borderColor: pkg.color }}
                    />
                  </div>
                  <span className="text-xs text-[var(--gray-500)] mt-4 uppercase tracking-wider">
                    {pkg.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="relative"
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[var(--accent)] text-[var(--background)] text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <Card
                  hover
                  glow={pkg.popular}
                  className={`h-full flex flex-col ${
                    pkg.popular ? "border-[var(--accent)]/30" : ""
                  }`}
                >
                  <div className="mb-6">
                    <span
                      className="inline-block w-3 h-3 rounded-full mb-4"
                      style={{ background: pkg.color }}
                    />
                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-[var(--gray-500)] text-sm">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl lg:text-4xl font-bold">
                      {pkg.price}
                    </span>
                    <span className="text-[var(--gray-500)] text-sm ml-2">
                      / {pkg.timeline}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: pkg.color }}
                        />
                        <span className="text-[var(--gray-300)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    href={pkg.id === 2 ? "/sign-up" : "/explore"}
                    variant={pkg.popular ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {pkg.id === 2 ? "Create Account" : "Start Exploring"}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)] relative overflow-hidden">
        {/* Background decorations */}
        <GeometricShapes variant="scattered" className="opacity-20" />

        <div className="max-w-3xl mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Common Questions
            </h2>
            <p className="text-[var(--gray-400)]">
              Have other questions? Get in touch.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-6 bg-[var(--gray-800)] rounded-xl border border-[var(--gray-700)] hover:border-[var(--gray-600)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{faq.question}</h3>
                    <motion.span
                      animate={{ rotate: openFaq === index ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[var(--accent)] text-2xl"
                    >
                      +
                    </motion.span>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[var(--gray-400)] mt-4 leading-relaxed overflow-hidden"
                      >
                        {faq.answer}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background decorations */}
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
              Pick a city and start discovering curated places and itineraries.
              No sign-up needed.
            </p>
            <Button href="/explore" size="lg">
              Explore Cities
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
