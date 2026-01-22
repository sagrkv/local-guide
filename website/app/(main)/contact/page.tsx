"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
} from "@/components/visuals";

const budgetOptions = [
  { value: "", label: "Select budget range" },
  { value: "50k-1l", label: "₹50K - ₹1L" },
  { value: "1l-2l", label: "₹1L - ₹2L" },
  { value: "2l+", label: "₹2L+" },
  { value: "not-sure", label: "Not sure yet" },
];

const sourceOptions = [
  { value: "", label: "How did you find us? (optional)" },
  { value: "google", label: "Google Search" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      budget: formData.get("budget"),
      description: formData.get("description"),
      source: formData.get("source"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Background visuals */}
        <GeometricShapes variant="corner" className="top-20 right-0 opacity-40" />
        <GlowOrb
          className="top-0 left-1/4"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="bottom-0 right-10 hidden lg:block"
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
              Let's Talk
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl leading-relaxed">
              Have a project in mind? Tell us about it. We'll respond within 24
              hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 lg:py-24 relative">
        {/* Background decorations */}
        <TechLines variant="horizontal" className="top-1/3 opacity-20" />
        <GeometricShapes variant="scattered" className="opacity-15" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="lg:col-span-3"
            >
              {isSubmitted ? (
                <div className="bg-[var(--gray-800)] rounded-2xl p-12 text-center">
                  <span className="text-6xl mb-6 block">✓</span>
                  <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                  <p className="text-[var(--gray-400)] mb-8">
                    Thanks for reaching out. We'll get back to you within 24
                    hours.
                  </p>
                  <Button onClick={() => setIsSubmitted(false)} variant="secondary">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      name="name"
                      label="Name"
                      placeholder="Your name"
                      required
                    />
                    <Input
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      name="company"
                      label="Company / Project Name"
                      placeholder="Your company or project"
                    />
                    <Select
                      name="budget"
                      label="Budget Range"
                      options={budgetOptions}
                    />
                  </div>

                  <Textarea
                    name="description"
                    label="Project Description"
                    placeholder="Tell us about your project, goals, and any specific requirements..."
                    required
                  />

                  <Select
                    name="source"
                    label="How did you find us?"
                    options={sourceOptions}
                  />

                  {error && (
                    <p className="text-red-500 text-sm bg-red-500/10 p-4 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="lg:col-span-2"
            >
              <div className="bg-[var(--gray-800)] rounded-2xl p-8 border border-[var(--gray-700)] sticky top-32 relative overflow-hidden">
                {/* Background visual - Network pattern */}
                <div className="absolute inset-0 opacity-20">
                  <CircuitPattern animated={false} opacity={0.15} />
                </div>
                <div className="absolute top-4 right-4">
                  <DotGrid
                    rows={4}
                    cols={4}
                    gap={10}
                    dotSize={1.5}
                    animated={false}
                    highlightPattern={false}
                  />
                </div>

                <div className="relative z-10">
                  <h2 className="text-xl font-bold mb-6">Contact Info</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[var(--gray-500)] text-sm uppercase tracking-wider mb-2">
                        Email
                      </h3>
                      <a
                        href="mailto:hello@summerstudios.in"
                        className="text-[var(--accent)] hover:text-white transition-colors"
                      >
                        hello@summerstudios.in
                      </a>
                    </div>

                    <div>
                      <h3 className="text-[var(--gray-500)] text-sm uppercase tracking-wider mb-2">
                        Location
                      </h3>
                      <p className="text-white">South India (Remote-first)</p>
                      <p className="text-[var(--gray-400)] text-sm mt-1">
                        Bangalore • Hyderabad • Chennai • Mysore • Kochi
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[var(--gray-500)] text-sm uppercase tracking-wider mb-2">
                        Response Time
                      </h3>
                      <p className="text-white">Within 24 hours</p>
                    </div>
                  </div>

                  <hr className="border-[var(--gray-700)] my-8" />

                  <div>
                    <h3 className="text-[var(--gray-500)] text-sm uppercase tracking-wider mb-4">
                      Follow Us
                    </h3>
                    <div className="flex gap-4">
                      <a
                        href="https://twitter.com/summerstudios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--gray-400)] hover:text-white transition-colors"
                      >
                        Twitter / X
                      </a>
                      <a
                        href="https://linkedin.com/company/summerstudios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--gray-400)] hover:text-white transition-colors"
                      >
                        LinkedIn
                      </a>
                      <a
                        href="https://instagram.com/summerstudios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--gray-400)] hover:text-white transition-colors"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
