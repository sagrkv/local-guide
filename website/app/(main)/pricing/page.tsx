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
    name: "Starter",
    price: "₹50,000",
    priceShort: "₹50K",
    description: "Startups, MVPs, campaign landing pages",
    features: [
      "Single-page responsive website",
      "Custom design (not a template)",
      "Contact form integration",
      "Basic SEO setup",
      "Mobile optimization",
      "2 rounds of revisions",
    ],
    timeline: "1-2 weeks",
    color: "#3B82F6",
    popular: false,
  },
  {
    id: 2,
    name: "Business",
    price: "₹1,00,000",
    priceShort: "₹1L",
    description: "Growing businesses, professional services",
    features: [
      "5-7 page responsive website",
      "Custom design + brand alignment",
      "Contact forms + basic analytics",
      "SEO optimization",
      "CMS for easy updates (optional)",
      "3 rounds of revisions",
    ],
    timeline: "3-4 weeks",
    color: "#10B981",
    popular: true,
  },
  {
    id: 3,
    name: "Professional",
    price: "₹2,00,000",
    priceShort: "₹2L",
    description: "E-commerce, SaaS products, complex needs",
    features: [
      "Full web application",
      "Database integration",
      "User authentication",
      "Admin dashboard",
      "API integrations",
      "Comprehensive documentation",
      "30 days post-launch support",
    ],
    timeline: "6-8 weeks",
    color: "#F59E0B",
    popular: false,
  },
  {
    id: 4,
    name: "Custom",
    price: "Let's talk",
    priceShort: "Custom",
    description: "Complex applications, mobile apps, enterprise",
    features: [
      "Custom scoping and planning",
      "Dedicated project management",
      "Flexible milestone payments",
      "Extended support options",
      "Full documentation",
      "Training and handover",
    ],
    timeline: "Varies",
    color: "#8B5CF6",
    popular: false,
  },
];

const faqs = [
  {
    question: "What's your payment structure?",
    answer:
      "50% upfront to begin, 50% on completion. For larger projects, we can discuss milestone-based payments.",
  },
  {
    question: "Do you offer ongoing maintenance?",
    answer:
      "Yes. We offer monthly maintenance packages starting at ₹5,000/month.",
  },
  {
    question: "Can you work with my existing brand guidelines?",
    answer:
      "Absolutely. We'll work within your brand or help refine it if needed.",
  },
  {
    question: "What if I need changes after launch?",
    answer:
      "Minor tweaks within 2 weeks of launch are included. Larger changes are billed at our hourly rate.",
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
              Transparent Pricing
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl mx-auto leading-relaxed">
              No surprises. No hidden fees. Pick a package or tell us what you
              need.
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    href="/contact"
                    variant={pkg.popular ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {pkg.id === 4 ? "Schedule a Call" : "Get Started"}
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
              Not sure which package?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              Tell us about your project and we'll recommend the best option for
              your needs and budget.
            </p>
            <Button href="/contact" size="lg">
              Let's Talk
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
