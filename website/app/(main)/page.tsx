"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
  DeviceMockup,
  BrowserIcon,
  LayersIcon,
  ServerIcon,
} from "@/components/visuals";

// Services data with tech icons
const services = [
  {
    title: "Landing Pages",
    description:
      "High-converting one-pagers that make first impressions count. Perfect for launches, campaigns, and MVPs.",
    Icon: BrowserIcon,
  },
  {
    title: "Business Websites",
    description:
      "Multi-page sites that tell your story and drive results. Custom design, seamless experience.",
    Icon: LayersIcon,
  },
  {
    title: "Web Applications",
    description:
      "Custom tools, dashboards, and platforms. From database to deployment, we handle the complexity.",
    Icon: ServerIcon,
  },
];

// Featured work data
const featuredWork = [
  {
    title: "TRST01 Platform",
    client: "TRST01",
    category: "Web Application",
    image: "/work/trst01.jpg",
    color: "#10B981",
  },
  {
    title: "Param Foundation",
    client: "Param Foundation",
    category: "Web Application",
    image: "/work/param.jpg",
    color: "#8B5CF6",
  },
  {
    title: "Trippr World",
    client: "Trippr",
    category: "Business Website",
    image: "/work/trippr.jpg",
    color: "#F59E0B",
  },
];

// Testimonials data
const testimonials = [
  {
    quote:
      "Summer Studios delivered our startup website in under 3 weeks. The attention to detail and performance optimization exceeded our expectations.",
    author: "Founder",
    company: "Tech Startup, Bangalore",
  },
  {
    quote:
      "Finally, a dev team that actually understands design. Our conversion rate doubled after the redesign.",
    author: "Marketing Lead",
    company: "E-commerce Brand, Chennai",
  },
  {
    quote:
      "Professional, fast, and no bullshit. They quoted ₹1L and delivered exactly what they promised.",
    author: "Owner",
    company: "Local Business, Hyderabad",
  },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Geometric shapes layer */}
        <GeometricShapes variant="hero" className="opacity-60" />

        {/* Glow orbs for atmosphere */}
        <GlowOrb
          className="top-1/4 -left-32"
          color="var(--accent)"
          size="xl"
          intensity="low"
        />
        <GlowOrb
          className="bottom-1/4 -right-32"
          color="#3B82F6"
          size="lg"
          intensity="low"
        />

        {/* Circuit pattern overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-40 opacity-40">
          <CircuitPattern className="w-full max-w-4xl" animated />
        </div>

        {/* Dot grid in corners */}
        <DotGrid
          className="top-10 right-10 hidden lg:block"
          rows={6}
          cols={8}
          gap={16}
          highlightPattern
        />
        <DotGrid
          className="bottom-10 left-10 hidden lg:block"
          rows={6}
          cols={8}
          gap={16}
          highlightPattern
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          >
            <span className="inline-block text-[var(--accent)] text-sm font-medium tracking-widest uppercase mb-6">
              Web Development Studio
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 text-balance"
          >
            Websites that
            <br />
            <span className="text-gradient">actually work.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="text-lg lg:text-xl text-[var(--gray-400)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            We're a web development studio in South India building fast,
            beautiful sites for startups and growing businesses.{" "}
            <span className="text-white">No templates. No bloat.</span> Just
            clean code that converts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button href="/contact" size="lg">
              Start a Project
            </Button>
            <Button href="/work" variant="secondary" size="lg">
              View Our Work
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-[var(--gray-600)] rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-[var(--gray-400)] rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="py-24 lg:py-32 relative">
        {/* Background decorations */}
        <TechLines variant="horizontal" className="top-12 opacity-30" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <SectionHeading title="What we build" />

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.Icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  <Card glow className="h-full group">
                    <div className="mb-6">
                      <IconComponent
                        size={56}
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {service.title}
                    </h3>
                    <p className="text-[var(--gray-400)] leading-relaxed">
                      {service.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section className="py-24 lg:py-32 relative bg-[var(--gray-900)]">
        {/* Background decorations */}
        <GeometricShapes variant="scattered" className="opacity-30" />
        <GlowOrb
          className="top-1/2 left-1/4 -translate-y-1/2"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="flex items-end justify-between mb-12 lg:mb-16">
            <SectionHeading
              title="Recent work"
              subtitle="Selected projects from startups, e-commerce brands, and growing businesses."
              className="mb-0"
            />
            <Button href="/work" variant="ghost" className="hidden md:flex">
              View all projects
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredWork.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <Card className="p-0 overflow-hidden group">
                  {/* Project with Device Mockup */}
                  <div
                    className="aspect-[4/3] relative overflow-hidden p-6 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${project.color}15 0%, ${project.color}05 100%)`,
                    }}
                  >
                    {/* Mini laptop mockup */}
                    <div className="w-[85%] transform group-hover:scale-105 transition-transform duration-500">
                      <div className="relative">
                        {/* Screen bezel */}
                        <div className="relative bg-[#1a1a1a] rounded-t-lg p-1.5 border border-[#333]/50">
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#222]" />
                          <div
                            className="aspect-[16/10] rounded flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${project.color}30 0%, ${project.color}10 100%)`,
                            }}
                          >
                            <span
                              className="text-4xl font-bold opacity-40"
                              style={{ color: project.color }}
                            >
                              {project.title.charAt(0)}
                            </span>
                          </div>
                        </div>
                        {/* Keyboard base */}
                        <div className="h-2 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-lg">
                          <div className="absolute inset-x-0 h-[1px] bg-[#333]/50" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-[var(--accent)] font-medium uppercase tracking-wider">
                      {project.category}
                    </span>
                    <h3 className="text-lg font-semibold mt-2 text-white group-hover:text-[var(--accent)] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-[var(--gray-400)] text-sm mt-1">
                      {project.client}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button href="/work" variant="secondary">
              View all projects
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <SectionHeading
            title="What clients say"
            align="center"
            className="max-w-xl mx-auto"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <Card hover={false} className="h-full relative">
                  <span className="text-6xl text-[var(--accent)] opacity-20 absolute top-4 left-6">
                    "
                  </span>
                  <blockquote className="relative z-10 pt-8">
                    <p className="text-[var(--gray-300)] leading-relaxed mb-6">
                      {testimonial.quote}
                    </p>
                    <footer className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--gray-700)] flex items-center justify-center">
                        <span className="text-[var(--accent)] text-sm font-semibold">
                          {testimonial.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <cite className="not-italic text-white font-medium text-sm">
                          {testimonial.author}
                        </cite>
                        <p className="text-[var(--gray-500)] text-xs">
                          {testimonial.company}
                        </p>
                      </div>
                    </footer>
                  </blockquote>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--gray-900)] to-[var(--background)]" />

        {/* Decorative elements */}
        <GeometricShapes variant="corner" className="top-0 left-0 opacity-40" />
        <GeometricShapes
          variant="corner"
          className="bottom-0 right-0 rotate-180 opacity-40"
        />
        <GlowOrb
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          color="var(--accent)"
          size="xl"
          intensity="low"
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Ready to build
              <br />
              <span className="text-[var(--accent)]">something?</span>
            </h2>
            <p className="text-lg text-[var(--gray-400)] mb-10 leading-relaxed">
              Tell us about your project. We'll get back to you within 24 hours
              with a clear plan and honest pricing.
            </p>
            <Button href="/contact" size="lg">
              Get in Touch
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
