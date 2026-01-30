"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

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
  }

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
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
  index
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
      className="group relative p-6 rounded-2xl bg-[var(--gray-850)] border border-[var(--gray-700)] hover:border-[var(--gray-600)] transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-[var(--gray-800)] border border-[var(--gray-700)] flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[var(--gray-400)] text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// PRICING CARD COMPONENT
// ============================================
function PricingCard({
  name,
  price,
  credits,
  features,
  popular = false,
  index
}: {
  name: string;
  price: string;
  credits: string;
  features: string[];
  popular?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-8 rounded-2xl border ${
        popular
          ? "bg-gradient-to-b from-[var(--gray-800)] to-[var(--gray-850)] border-[var(--accent)]/50"
          : "bg-[var(--gray-850)] border-[var(--gray-700)]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="badge badge-accent">Most Popular</span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-[var(--gray-400)]">/month</span>
        </div>
        <p className="text-[var(--accent)] text-sm mt-2">{credits}</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[var(--gray-300)]">
            <svg className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/sign-up"
        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          popular
            ? "bg-[var(--accent)] text-[var(--background)] hover:bg-[#FF8C40]"
            : "bg-[var(--gray-800)] text-white border border-[var(--gray-600)] hover:bg-[var(--gray-700)]"
        }`}
      >
        Get Started
      </Link>
    </motion.div>
  );
}

// ============================================
// FAQ ITEM COMPONENT
// ============================================
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-[var(--gray-700)]"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-white font-medium pr-8">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--gray-400)] text-xl shrink-0"
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
        <p className="pb-5 text-[var(--gray-400)] text-sm leading-relaxed">{answer}</p>
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

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: "Map-Based Targeting",
      description: "Draw rectangles on a map to define your target regions. Our grid system divides areas into 2km cells for precise local business discovery.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      title: "Smart Pre-Filters",
      description: "Set criteria before scraping. Only pay for leads that match your exact requirements - no wasted credits on unqualified prospects.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Website Analysis",
      description: "Lighthouse scores reveal which businesses have poor or no websites. Focus on leads that actually need your web services.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI Sales Intelligence",
      description: "Perplexity AI researches each lead - decision makers, company size, pain points. Close deals faster with deep insights.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pay Per Lead",
      description: "Credit-based pricing means you only pay for results. 1 credit = 1 qualified lead. No subscriptions, no hidden fees.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "GDPR Compliant",
      description: "Full data export, deletion requests, and audit logging. Your data stays yours. Built for privacy-conscious businesses.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Define Your Target",
      description: "Draw a region on the map or select from preset city zones. Set your filters: business category, website quality, location.",
    },
    {
      number: "02",
      title: "Launch Smart Scrape",
      description: "Our system searches Google Places, validates each business against your criteria, and only charges for matches.",
    },
    {
      number: "03",
      title: "Close More Deals",
      description: "Get qualified leads with contact info, website analysis, and AI-generated sales intelligence. Start outreach immediately.",
    },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "₹999",
      credits: "100 credits included",
      features: [
        "100 lead credits",
        "Map-based region selection",
        "Basic lead filtering",
        "CSV export",
        "Email support",
      ],
    },
    {
      name: "Growth",
      price: "₹2,499",
      credits: "300 credits included",
      popular: true,
      features: [
        "300 lead credits",
        "Everything in Starter",
        "Lighthouse website analysis",
        "Tech stack detection",
        "Priority support",
      ],
    },
    {
      name: "Scale",
      price: "₹4,999",
      credits: "750 credits included",
      features: [
        "750 lead credits",
        "Everything in Growth",
        "AI sales intelligence",
        "API access",
        "Dedicated account manager",
      ],
    },
  ];

  const faqs = [
    {
      question: "How does the credit system work?",
      answer: "Each credit equals one qualified lead. You only spend credits when a lead matches your pre-set filters. No matches = no charge. Credits never expire and can be topped up anytime.",
    },
    {
      question: "What data do I get for each lead?",
      answer: "Each lead includes business name, address, phone, email (when available), website, Google rating, category, and location coordinates. Premium features add Lighthouse scores, tech stack, and AI-generated sales insights.",
    },
    {
      question: "How accurate is the lead data?",
      answer: "We source data from Google Places API (official), which is highly accurate for business information. We deduplicate leads and validate contact details before delivery.",
    },
    {
      question: "Can I filter leads before scraping?",
      answer: "Yes! Set pre-filters for business category, minimum rating, website presence, location radius, and more. You only pay for leads that match ALL your criteria.",
    },
    {
      question: "Is there an API for integration?",
      answer: "Yes, Scale plan includes full API access. Integrate lead data directly into your CRM, outreach tools, or custom workflows.",
    },
    {
      question: "What's your refund policy?",
      answer: "Unused credits can be refunded within 30 days of purchase. Used credits are non-refundable since they represent delivered leads.",
    },
  ];

  const testimonials = [
    {
      quote: "Found 200+ qualified leads in Bangalore in under an hour. The website quality filter saved us from wasting time on businesses that don't need our services.",
      author: "Rajesh K.",
      role: "Founder, WebCraft Agency",
    },
    {
      quote: "The AI sales intelligence is a game-changer. We closed 3 deals in the first week just from the insights Leedo provided about each prospect.",
      author: "Priya M.",
      role: "Sales Lead, Digital Solutions",
    },
    {
      quote: "Finally, a lead gen tool that understands the Indian market. Map targeting for specific localities is exactly what we needed.",
      author: "Amit S.",
      role: "Business Development, TechServe",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ==================== HERO SECTION ==================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />

        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

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
            <span className="badge badge-accent">
              <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
              Now in Beta
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance"
          >
            Find leads that
            <br />
            <span className="text-accent-gradient">actually convert.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--gray-400)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            B2B lead generation for India. Target businesses by location, filter by website quality,
            and get AI-powered sales intelligence.{" "}
            <span className="text-white">Pay only for qualified leads.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/sign-up" className="btn-primary text-lg px-8 py-4">
              Start Free Trial
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
              See How It Works
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
              { value: 50000, suffix: "+", label: "Leads Generated" },
              { value: 500, suffix: "+", label: "Active Users" },
              { value: 98, suffix: "%", label: "Data Accuracy" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-[var(--gray-500)]">{stat.label}</div>
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
            className="w-6 h-10 border-2 border-[var(--gray-600)] rounded-full flex justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-[var(--gray-400)] rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section className="section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--gray-900)] to-[var(--background)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">Features</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything you need to
              <br />
              <span className="text-gradient">find perfect leads</span>
            </h2>
            <p className="text-[var(--gray-400)] max-w-2xl mx-auto">
              From discovery to deal close, Leedo gives you the tools to find, qualify, and convert B2B leads in India.
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
      <section id="how-it-works" className="section relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">How It Works</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Three steps to
              <br />
              <span className="text-gradient">qualified leads</span>
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
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-[var(--gray-600)] to-transparent" />
                )}

                <div className="text-6xl font-bold text-[var(--gray-800)] mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-[var(--gray-400)] text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING SECTION ==================== */}
      <section className="section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--gray-900)] to-[var(--background)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">Pricing</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple, credit-based
              <br />
              <span className="text-gradient">pricing</span>
            </h2>
            <p className="text-[var(--gray-400)] max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Buy credits, use them when you need leads.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <PricingCard key={index} {...plan} index={index} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[var(--gray-500)] text-sm mt-8"
          >
            All plans include 7-day free trial with 10 credits. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      <section className="section relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Trusted by sales teams
              <br />
              <span className="text-gradient">across India</span>
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
                className="p-6 rounded-2xl bg-[var(--gray-850)] border border-[var(--gray-700)]"
              >
                <div className="text-[var(--accent)] text-4xl mb-4">"</div>
                <p className="text-[var(--gray-300)] mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#FF8C40] flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{testimonial.author}</div>
                    <div className="text-[var(--gray-500)] text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--gray-900)] to-[var(--background)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Frequently asked
              <br />
              <span className="text-gradient">questions</span>
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
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] to-[var(--gray-900)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/10 rounded-full blur-[150px]" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to find your
              <br />
              <span className="text-accent-gradient">next 100 customers?</span>
            </h2>
            <p className="text-lg text-[var(--gray-400)] mb-10 leading-relaxed">
              Start your free trial today. No credit card required.
              Get 10 free credits to test the platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
