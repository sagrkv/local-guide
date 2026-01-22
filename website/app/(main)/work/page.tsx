"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
} from "@/components/visuals";

gsap.registerPlugin(ScrollTrigger);

// Projects data
const projects = [
  {
    id: 1,
    title: "TRST01 Platform",
    client: "TRST01",
    category: "Web Application",
    description:
      "Supply chain transparency and ESG compliance platform with traceability, deforestation risk assessment, and audit-compliant documentation for EUDR compliance.",
    tags: ["Next.js", "TypeScript", "CMS", "PostgreSQL"],
    color: "#10B981",
    year: "2025",
  },
  {
    id: 2,
    title: "Param Foundation",
    client: "Param Foundation",
    category: "Web Application",
    description:
      "Membership management and ticketing platform for India's largest multi-sensory science experience centers. Handles 48,000+ visitors annually.",
    tags: ["Next.js", "TypeScript", "Ticketing", "PostgreSQL"],
    color: "#8B5CF6",
    year: "2025",
  },
  {
    id: 3,
    title: "Trippr World",
    client: "Trippr",
    category: "Business Website",
    description:
      "Budget-friendly hostel chain website with integrated booking system across multiple Indian destinations including Gokarna, Kodaikanal, and Mysuru.",
    tags: ["Next.js", "TypeScript", "Booking", "Tailwind"],
    color: "#F59E0B",
    year: "2024",
  },
  {
    id: 4,
    title: "Gonakal Homestay",
    client: "Gonakal Homestay",
    category: "Landing Page",
    description:
      "Heritage property website for a traditional homestay in Chikmagalur. Showcases the property's unique character and handles guest inquiries.",
    tags: ["JavaScript", "CSS", "Responsive"],
    color: "#A16207",
    year: "2024",
  },
  {
    id: 5,
    title: "OmmiForge",
    client: "OmmiForge",
    category: "Business Website",
    description:
      "Corporate website for precision forging solutions company. Professional multi-page site showcasing industrial capabilities and services.",
    tags: ["Next.js", "TypeScript", "Industrial"],
    color: "#EF4444",
    year: "2024",
  },
];

export default function WorkPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const horizontal = horizontalRef.current;
    const progress = progressRef.current;
    const progressBar = progressBarRef.current;

    if (!container || !horizontal) return;

    let ctx: gsap.Context;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const getCardWidth = () => {
      // Match the responsive classes: w-[85vw] md:w-[65vw] lg:w-[550px]
      const vw = window.innerWidth;
      if (vw >= 1024) return 550; // lg breakpoint
      if (vw >= 768) return vw * 0.65; // md breakpoint
      return vw * 0.85; // mobile
    };

    const initScroll = () => {
      // Kill existing context if any
      if (ctx) ctx.revert();

      ctx = gsap.context(() => {
        const cardWidth = getCardWidth();
        const gap = 32; // gap-8 = 32px
        const paddingLeft = 40; // pl-10 = 40px
        const paddingRight = 40; // pr-10 = 40px

        // Calculate total content width (cards + gaps + padding)
        const totalCardsWidth = (cardWidth * projects.length) + (gap * (projects.length - 1));
        const totalContentWidth = paddingLeft + totalCardsWidth + paddingRight;

        // Scroll distance: how far we need to scroll to see the last card fully
        // We want the last card to be centered/visible, not cut off
        const viewportWidth = window.innerWidth;
        const scrollDistance = Math.max(0, totalContentWidth - viewportWidth);

        gsap.to(horizontal, {
          x: -scrollDistance,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: `+=${scrollDistance + viewportWidth * 0.5}`, // Extra scroll for smooth ending
            scrub: 0.5, // Faster scrub for better mobile feel
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
            preventOverlaps: true,
            onUpdate: (self) => {
              if (progressBar) {
                progressBar.style.width = `${self.progress * 100}%`;
              }
            },
            onEnter: () => {
              if (progress) progress.style.opacity = "1";
            },
            onLeave: () => {
              if (progress) progress.style.opacity = "0";
            },
            onEnterBack: () => {
              if (progress) progress.style.opacity = "1";
            },
            onLeaveBack: () => {
              if (progress) progress.style.opacity = "0";
            },
          },
        });
      }, container);
    };

    const handleResize = () => {
      // Debounce resize to avoid excessive recalculations
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initScroll();
      }, 150);
    };

    // Initialize after fonts/images are ready
    if (document.readyState === 'complete') {
      initScroll();
    } else {
      window.addEventListener('load', initScroll, { once: true });
    }

    // Handle resize and orientation change
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Combined Header + Horizontal Scroll Gallery (Single Pinned Section) */}
      <section ref={containerRef} className="relative h-screen overflow-hidden">
        {/* Background decorations */}
        <GeometricShapes variant="scattered" className="opacity-20" />
        <DotGrid
          className="top-20 right-10 hidden lg:block absolute z-0"
          rows={8}
          cols={10}
          gap={18}
          highlightPattern
        />
        <GlowOrb
          className="top-0 right-0"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />

        {/* Header - Positioned at top, stays visible during scroll */}
        <div className="absolute top-0 left-0 right-0 z-10 pt-24 lg:pt-28 px-6 lg:px-10">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Our Work
              </h1>
              <p className="text-lg text-[var(--gray-400)] max-w-xl">
                Selected projects from startups, e-commerce brands, and growing
                businesses across South India.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Horizontal scroll container - Cards centered vertically */}
        <div
          ref={horizontalRef}
          className="flex items-center gap-8 h-full pl-10 pr-10"
          style={{ paddingTop: '100px' }}
        >
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="relative flex-shrink-0 w-[85vw] md:w-[65vw] lg:w-[550px] h-[480px] group"
            >
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden border border-[var(--gray-800)]"
                style={{
                  background: `linear-gradient(135deg, ${project.color}12 0%, ${project.color}03 100%)`,
                }}
              >
                {/* Device mockup in top right */}
                <div className="absolute top-6 right-6 w-[40%] hidden lg:block opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="relative transform group-hover:scale-105 transition-transform duration-500">
                    {/* Laptop frame */}
                    <div className="relative bg-[#1a1a1a] rounded-t-xl p-2 border border-[#333]/50">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#222]" />
                      <div
                        className="aspect-[16/10] rounded-lg flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${project.color}25 0%, ${project.color}08 100%)`,
                        }}
                      >
                        <span
                          className="text-5xl font-bold opacity-30"
                          style={{ color: project.color }}
                        >
                          {project.title.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-lg" />
                  </div>
                </div>

                {/* Project Number */}
                <div className="absolute top-4 left-6">
                  <span
                    className="text-[8rem] lg:text-[9rem] font-bold leading-none opacity-[0.06]"
                    style={{ color: project.color }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-xs font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{
                        background: `${project.color}20`,
                        color: project.color,
                      }}
                    >
                      {project.category}
                    </span>
                    <span className="text-[var(--gray-500)] text-sm">
                      {project.year}
                    </span>
                  </div>

                  <h2 className="text-2xl lg:text-3xl font-bold mb-1 text-white group-hover:text-[var(--accent)] transition-colors">
                    {project.title}
                  </h2>

                  <p className="text-[var(--gray-400)] text-sm mb-2">
                    {project.client}
                  </p>

                  <p className="text-[var(--gray-400)] text-sm leading-relaxed mb-4 max-w-xl line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-[var(--gray-400)] px-2.5 py-0.5 rounded-full bg-[var(--gray-800)] border border-[var(--gray-700)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button variant="secondary" size="sm" className="self-start">
                    View Case Study
                  </Button>
                </div>

                {/* Hover Border Effect */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-opacity-30 transition-all duration-500"
                  style={{ borderColor: project.color }}
                />
              </div>
            </motion.article>
          ))}
          {/* End spacer - ensures last card stays visible at scroll end */}
          <div
            className="flex-shrink-0 w-[15vw] md:w-[35vw] lg:w-[calc(100vw-550px-80px)]"
            aria-hidden="true"
          />
        </div>

        {/* Scroll Progress - Absolute within pinned section */}
        <div
          ref={progressRef}
          className="absolute bottom-8 left-6 lg:left-10 right-6 lg:right-10 z-20 pointer-events-none opacity-0 transition-opacity duration-300"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--gray-500)]">
              Scroll to explore
            </span>
            <div className="flex-1 h-[2px] bg-[var(--gray-800)] rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-[var(--accent)] transition-[width] duration-100"
                style={{ width: "0%" }}
              />
            </div>
            <span className="text-sm text-[var(--gray-500)]">
              {projects.length} Projects
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-0 pb-16 lg:pb-20 relative overflow-hidden">
        {/* Background decorations */}
        <CircuitPattern className="opacity-20" animated />
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
              Have a project in mind?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              We'd love to hear about it. Let's discuss how we can help bring
              your vision to life.
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
